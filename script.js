let activeDataSlot = 1;
let isSystemCoreUnlocked = false;
let targetedActiveLogIndex = null;
let ledgerPayloadDatabase = { slot1: [], slot2: [], slot3: [] };
let trackRuntimeSeconds = 0;
let localFolderDirectoryHandle = null;

// Global Event Hook for Ctrl+T / Cmd+T Keyboard Trigger
document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.id === 'editorInputArea' || activeElement.id === 'hindsightNoteEditorArea')) {
            event.preventDefault();
            
            const indexPointer = activeElement.selectionStart;
            const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const lineStamp = `\n[${timeString}] --------------------\n`;
            
            activeElement.value = activeElement.value.substring(0, indexPointer) + lineStamp + activeElement.value.substring(activeElement.selectionEnd);
            activeElement.focus();
            activeElement.setSelectionRange(indexPointer + lineStamp.length, indexPointer + lineStamp.length);
            
            refreshEditorConstraints();
            if(activeElement.id === 'hindsightNoteEditorArea') processHindsightNoteSave();
        }
    }
});

// Runtime Clock
setInterval(() => {
    trackRuntimeSeconds++;
    const mm = String(Math.floor(trackRuntimeSeconds / 60)).padStart(2, '0');
    const ss = String(trackRuntimeSeconds % 60).padStart(2, '0');
    document.getElementById('statSystemTime').innerText = `Instance Session Counter: ${mm}:${ss}`;
}, 1000);

function navigateToPage(pageKey) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active-page-tab'));
    document.querySelectorAll('.app-page-view').forEach(v => v.classList.remove('active-view'));

    document.getElementById(`pageTab-${pageKey}`).classList.add('active-page-tab');
    document.getElementById(`viewPage-${pageKey}`).classList.add('active-view');
}

function refreshEditorConstraints() {
    const editor = document.getElementById('editorInputArea');
    const characterRuleCap = parseInt(document.getElementById('charCapSelect').value);
    const marginConfigStyle = document.getElementById('marginWidthSelect').value;

    if (characterRuleCap > 0 && editor.value.length > characterRuleCap) {
        editor.value = editor.value.substring(0, characterRuleCap);
    }

    document.getElementById('liveCharIndicator').innerText = `${editor.value.length} Chars ${characterRuleCap > 0 ? '/' + characterRuleCap : ''}`;
    
    // Adjust text editor indentation widths dynamically
    if (marginConfigStyle === 'narrow') {
        editor.className = "journal-textarea margin-narrow";
    } else {
        editor.className = "journal-textarea margin-wide";
    }

    localStorage.setItem(`pxl_clean_draft_s${activeDataSlot}`, editor.value);
}

function performSlotSwap(targetNum) {
    document.querySelectorAll('.slot-button').forEach(b => b.classList.remove('active-slot'));
    document.getElementById(`slotTrigger-${targetNum}`).classList.add('active-slot');

    activeDataSlot = targetNum;
    const existingCache = localStorage.getItem(`pxl_clean_draft_s${activeDataSlot}`);
    document.getElementById('editorInputArea').value = existingCache ? existingCache : '';
    document.getElementById('documentTitleInput').value = '';

    targetedActiveLogIndex = null;
    document.getElementById('hindsightNoteEditorArea').value = '';
    document.getElementById('hindsightNoteEditorArea').disabled = true;
    document.getElementById('jumpToReviewDeskBtn').disabled = true;
    document.getElementById('fullScreenViewerTarget').innerHTML = '';

    refreshEditorConstraints();
    renderDirectoryStreamList();
}

function injectTimeMarker() {
    const ed = document.getElementById('editorInputArea');
    ed.focus();
    const mockEvent = new KeyboardEvent('keydown', { key: 't', ctrlKey: true });
    document.dispatchEvent(mockEvent);
}

function wipeWriterDraft() {
    if (confirm("Discard text inside this draft buffer?")) {
        document.getElementById('editorInputArea').value = '';
        document.getElementById('documentTitleInput').value = '';
        localStorage.removeItem(`pxl_clean_draft_s${activeDataSlot}`);
        refreshEditorConstraints();
    }
}

// Authentication Layers
function evaluateVaultKeySignatureStatus() {
    const systemRegisteredToken = localStorage.getItem('pxl_clean_vault_token');
    if (systemRegisteredToken) {
        document.getElementById('gateTitle').innerText = "🔒 SYSTEM RE-LOCK ROUTINE";
        document.getElementById('gateActionBtn').innerText = "Validate Key & Mount";
    } else {
        document.getElementById('gateTitle').innerText = "🆕 CREATE MASTER PASSWORD PIN";
        document.getElementById('gateActionBtn').innerText = "Register System Password Key";
    }
}

function processVaultAuthentication() {
    const passFieldString = document.getElementById('vaultGateInput').value;
    if(!passFieldString) return;

    const persistentKeyToken = localStorage.getItem('pxl_clean_vault_token');

    if (!persistentKeyToken) {
        localStorage.setItem('pxl_clean_vault_token', passFieldString);
        confirmVaultClearanceUnlock();
    } else {
        if (passFieldString === persistentKeyToken) {
            confirmVaultClearanceUnlock();
        } else {
            alert("🚨 ACCESS REFUSED.");
                }
    }
}

function confirmVaultClearanceUnlock() {
    isSystemCoreUnlocked = true;
    document.getElementById('gateKeeperOverlay').style.display = 'none';
    document.getElementById('vaultGateInput').value = '';

    const localPackedDataBlob = localStorage.getItem('pxl_clean_payload_database');
    if(localPackedDataBlob) {
        try {
            ledgerPayloadDatabase = JSON.parse(localPackedDataBlob);
        } catch(e) {
            ledgerPayloadDatabase = { slot1: [], slot2: [], slot3: [] };
        }
    }
    renderDirectoryStreamList();
    refreshEditorConstraints();
}

function lockSystemVault() {
    isSystemCoreUnlocked = false;
    document.getElementById('gateKeeperOverlay').style.display = 'flex';
    document.getElementById('hindsightNoteEditorArea').value = '';
    document.getElementById('hindsightNoteEditorArea').disabled = true;
    document.getElementById('jumpToReviewDeskBtn').disabled = true;
    navigateToPage('writer');
    evaluateVaultKeySignatureStatus();
}

// Data Storage Systems
async function commitTextToArchiveDB() {
    if(!isSystemCoreUnlocked) return;

    const dataContentString = document.getElementById('editorInputArea').value;
    if(!dataContentString.trim()) return;

    const cleaningRawTimestamp = new Date();
    const trackingDateStamp = cleaningRawTimestamp.toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});
    
    let inputTitle = document.getElementById('documentTitleInput').value.trim();
    if(!inputTitle) {
        inputTitle = `Untitled Ledger Node (${trackingDateStamp})`;
    }

    const logElementPayload = {
        id: Date.now(),
        title: inputTitle,
        timestamp: trackingDateStamp,
        body: dataContentString,
        notes: ""
    };

    ledgerPayloadDatabase[`slot${activeDataSlot}`].push(logElementPayload);
    commitDatabaseStateToDisk();

    if (localFolderDirectoryHandle) {
        try {
            const cleanFileTitle = `slot_${activeDataSlot}_log_${Date.now()}.txt`;
            const fileHandlePointer = await localFolderDirectoryHandle.getFileHandle(cleanFileTitle, { create: true });
            const fileWritableStream = await fileHandlePointer.createWritable();
            
            const externalPlainTxtOutputFormat = `TITLE: ${inputTitle}\nTIMESTAMP: ${trackingDateStamp}\nSLOT SOURCE ID: Slot 0${activeDataSlot}\n-----------------------------\n\n${dataContentString}`;
            
            await fileWritableStream.write(externalPlainTxtOutputFormat);
            await fileWritableStream.close();
        } catch(dirError) {
            console.warn("Folder link writing failed.", dirError);
        }
    }

    document.getElementById('editorInputArea').value = '';
    document.getElementById('documentTitleInput').value = '';
    localStorage.removeItem(`pxl_clean_draft_s${activeDataSlot}`);
    refreshEditorConstraints();

    renderDirectoryStreamList();
    alert("Entry logged successfully into local framework sheets!");
}

function commitDatabaseStateToDisk() {
    localStorage.setItem('pxl_clean_payload_database', JSON.stringify(ledgerPayloadDatabase));
}

// Render Lists Directory Arrays
function renderDirectoryStreamList() {
    const listTarget = document.getElementById('logsListTargetBox');
    listTarget.innerHTML = '';

    if(!isSystemCoreUnlocked) return;

    const listDatasetMatrix = ledgerPayloadDatabase[`slot${activeDataSlot}`] || [];
    const searchKeywordFilterTerm = document.getElementById('keywordSearchFilter').value.toLowerCase();

    document.getElementById('statLogCount').innerText = `Slot Archive Records: ${String(listDatasetMatrix.length).padStart(2, '0')}`;

    if(listDatasetMatrix.length === 0) {
        listTarget.innerHTML = ``;
        return;
    }

    [...listDatasetMatrix].reverse().forEach((logItem, indexReversalID) => {
        const noteTitle = logItem.title || `Untitled Log File`;
        const noteBody = logItem.body || "";

        if (searchKeywordFilterTerm && !noteTitle.toLowerCase().includes(searchKeywordFilterTerm) && !noteBody.toLowerCase().includes(searchKeywordFilterTerm)) return;

        const logicalChronologicalID = (listDatasetMatrix.length - 1) - indexReversalID;
        const elementRowNode = document.createElement('div');
        elementRowNode.className = 'ledger-item-row';
        if(logicalChronologicalID === targetedActiveLogIndex) elementRowNode.classList.add('selected-row');

        elementRowNode.onclick = () => mountLogForAnnotationAndReview(logicalChronologicalID);

        elementRowNode.innerHTML = `
            <div class="ledger-meta">LOG REF-%${String(logicalChronologicalID + 1).padStart(3, '0')} // ${logItem.timestamp}</div>
            <div style="font-weight:bold; font-size: 11px;">📂 ${scrubHTMLInjections(noteTitle)}</div>
        `;
        listTarget.appendChild(elementRowNode);
    });
}

function mountLogForAnnotationAndReview(targetIndexID) {
    targetedActiveLogIndex = targetIndexID;
    renderDirectoryStreamList();

    const targetedEntryReferenceObject = ledgerPayloadDatabase[`slot${activeDataSlot}`][targetIndexID];

    const noteArea = document.getElementById('hindsightNoteEditorArea');
    noteArea.disabled = false;
    noteArea.value = targetedEntryReferenceObject.notes || "";

    document.getElementById('jumpToReviewDeskBtn').disabled = false;

    const viewTargetConsole = document.getElementById('fullScreenViewerTarget');
    viewTargetConsole.innerHTML = '';

    // Layout Container Buildout
    const topMetaHeader = document.createElement('div');
    topMetaHeader.style.cssText = "font-size:8px; font-family:var(--font-pixel); color:var(--color-iron); border-bottom:2px dashed var(--color-iron); padding-bottom:6px; margin-bottom:14px;";
    topMetaHeader.textContent = `MOUNTED INSPECTION TRACK // LOG POSITION: #${String(targetIndexID + 1).padStart(3, '0')}`;

    const noteTitleHeading = document.createElement('div');
    noteTitleHeading.style.cssText = "font-size:12px; font-weight:bold; color:var(--color-iron); margin-bottom:4px;";
    noteTitleHeading.textContent = `📂 ${targetedEntryReferenceObject.title || 'Untitled Document Node'}`;

    const timeSubLabel = document.createElement('div');
    timeSubLabel.style.cssText = "font-size:7px; color:#666; margin-bottom:16px;";
    timeSubLabel.textContent = `Committed Baseline Node: ${targetedEntryReferenceObject.timestamp}`;

    // Literal, unparsed source container
    const bodyContentContainer = document.createElement('div');
    bodyContentContainer.className = "raw-text-block";
    bodyContentContainer.style.cssText = "color:var(--color-ink); background:#fdfdf5; padding:16px; border:2px solid var(--color-ink); margin-bottom:20px;";
    bodyContentContainer.textContent = targetedEntryReferenceObject.body;

    const notesDividerHeader = document.createElement('div');
    notesDividerHeader.style.cssText = "border-top:4px solid var(--color-iron); padding-top:12px;";
    notesDividerHeader.innerHTML = `<div style="font-size:8px; color:var(--color-iron); margin-bottom:8px;">%📌 HINDSIGHT NOTE LAYER:</div>`;

    const notesContentContainer = document.createElement('div');
    notesContentContainer.id = "reviewScreenNoteMirrorTextBox";
    notesContentContainer.className = "raw-text-block";
    notesContentContainer.style.cssText = "background:#fdfdf5; border:2px dashed var(--color-ink); padding:14px; color:#111;";
    
    notesContentContainer.textContent = targetedEntryReferenceObject.notes || "";

    notesDividerHeader.appendChild(notesContentContainer);

    viewTargetConsole.appendChild(topMetaHeader);
    viewTargetConsole.appendChild(noteTitleHeading);
    viewTargetConsole.appendChild(timeSubLabel);
    viewTargetConsole.appendChild(bodyContentContainer);
    viewTargetConsole.appendChild(notesDividerHeader);
}

function processHindsightNoteSave() {
    if(targetedActiveLogIndex === null) return;
    const updatedNoteStringValue = document.getElementById('hindsightNoteEditorArea').value;

    ledgerPayloadDatabase[`slot${activeDataSlot}`][targetedActiveLogIndex].notes = updatedNoteStringValue;
    commitDatabaseStateToDisk();

    const visualMirrorBox = document.getElementById('reviewScreenNoteMirrorTextBox');
    if(visualMirrorBox) {
        visualMirrorBox.textContent = updatedNoteStringValue || "";
    }
}

// Local Storage / Sync Handlers
async function requestLocalFolderAccessHandle() {
    if (window.showDirectoryPicker) {
        try {
            localFolderDirectoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            document.getElementById('folderLinkStatusNode').innerText = `Status: Linked 🟢 (Automated log drops online)`;
            document.getElementById('folderLinkStatusNode').style.color = "green";
        } catch (err) {
            alert("Workspace Directory configuration mapping access denied.");
        }
    } else {
        alert("Browser configuration limitations discovered.");
    }
}

function downloadJSONBackupMap() {
    if(!isSystemCoreUnlocked) return;
    const documentPayloadAnchorBlobString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ledgerPayloadDatabase));
    const dummyLinkAnchor = document.createElement('a');
    dummyLinkAnchor.setAttribute("href", documentPayloadAnchorBlobString);
    dummyLinkAnchor.setAttribute("download", `pixeledger_backup_${Date.now()}.json`);
    document.body.appendChild(dummyLinkAnchor);
    dummyLinkAnchor.click();
    dummyLinkAnchor.removeChild(dummyLinkAnchor);
}

function uploadJSONBackupMap(event) {
    const dataFileReader = new FileReader();
    dataFileReader.onload = function(e) {
        try {
            const structuralPayloadResult = JSON.parse(e.target.result);
            if(structuralPayloadResult.slot1 && structuralPayloadResult.slot2 && structuralPayloadResult.slot3) {
                ledgerPayloadDatabase = structuralPayloadResult;
                commitDatabaseStateToDisk();
                renderDirectoryStreamList();
                alert("Ledger package array elements synchronized cleanly.");
            } else {
                alert("Data alignment failure structural mismatch.");
            }
        } catch(err) {
            alert("Parsing failure.");
        }
    };
    dataFileReader.readAsText(event.target.files[0]);
}

function totalDeviceHardPurge() {
    if (confirm("🚨 Wipe everything permanently?")) {
        localStorage.clear();
        location.reload();
    }
}

function scrubHTMLInjections(str) {
    return str.replace(/[&<>'"]/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[match] || match));
}

window.onload = () => {
    evaluateVaultKeySignatureStatus();
    const writerInitialCache = localStorage.getItem('pxl_clean_draft_s1');
    if(writerInitialCache) document.getElementById('editorInputArea').value = writerInitialCache;
    refreshEditorConstraints();
};