const uploadPage = document.getElementById('uploadPage');
const editorPage = document.getElementById('editorPage');

const fileInput = document.getElementById('fileInput');
const submitButton = document.getElementById('submitButton');

const dropZone = document.getElementById('dropZone');
const uploadText = document.getElementById('uploadText');
const fileInfo = document.getElementById('fileInfo');
const status = document.getElementById('status');

const paymentTypes = ['Cash', 'Bkash', 'Card'];
let isCellsEditable = false;

let rowCount = 1;
let currentData = [];


// File Input Handlers
fileInput.addEventListener('change', handleFileSelect);

// Drag & Drop Handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-sky-400', 'bg-slate-700/50');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-sky-400', 'bg-slate-700/50');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-sky-400', 'bg-slate-700/50');
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect();
    }
});

function handleFileSelect() {
    if (fileInput.files.length) {
        uploadText.classList.add('hidden');
        fileInfo.classList.remove('hidden');
        fileInfo.querySelector('p').textContent = fileInput.files[0].name;
        submitButton.disabled = false;
    }
}

function clearFile() {
    fileInput.value = '';
    uploadText.classList.remove('hidden');
    fileInfo.classList.add('hidden');
    submitButton.disabled = true;
}

// Form Submission Handler
document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) return;

    status.classList.remove('hidden');
    status.querySelector('.status-text').textContent = 'Processing...';
    submitButton.disabled = true;

    document.getElementById('displayDate').textContent = document.getElementById('working_date').value;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        currentData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
        
        // Process columns with date conversion
        currentData = currentData.map(row => {
            const excelDate = row[18];
            let dateValue = '';
            
            // Convert Excel date serial to JS Date
            if (typeof excelDate === 'number') {
                const parsedDate = XLSX.SSF.parse_date_code(excelDate);
                // Use Date.UTC to create the date in UTC
                const jsDate = new Date(Date.UTC(
                    parsedDate.y,
                    parsedDate.m - 1, // Months are 0-based in JS
                    parsedDate.d
                ));
                dateValue = jsDate.toISOString().split('T')[0];
            }

            return [
                row[2] || '',  // C -> Cash A/C
                row[4] || '',  // E -> Hire A/C
                row[12] || '', // M -> Amount
                'Cash',        // Payment Type (default)
                true,          // is installment
                dateValue,     // S -> Converted Date
                ''             // Remarks
            ];
        });

        if(currentData.length > 0 && currentData[0].some(cell => typeof cell === 'string')) {
            currentData = currentData.slice(1);
        }

        // filter by date
        const working_date = document.getElementById('working_date').value;
        currentData = currentData.filter(row => row[5] === working_date);

        // Add total rows to currentData
        currentData.push(
            ['', '', '', '', '', '', ''],
            ['', '', '', '', '', '', ''],
            ['Total BCB', 0, '', 'Expense Name', 'Expense Amount', '', 'Collection'],
            ['', '', '', '', '', '', ''],

            ['Cash', 0, '', '', '', '', 'Account'],
            ['Bkash', 0, '', '', '', '', ''],
            ['Card', 0, '', '', '', '', ''],
            ['Expense', 0, '', '', '', '', ''],
        );

        setTimeout(() => {
            uploadPage.classList.add('hidden-page');
            editorPage.classList.remove('hidden-page');
            initializeEditor();
            status.classList.add('hidden');
        }, 500);
    };
    reader.readAsArrayBuffer(file);
});

// Editor Functions
function createRow(data = ['', '', '', '', '', '', '']) {
    const row = document.createElement('div');
    row.className = 'contents';

    // SN Column
    const rowNumberCell = document.createElement('div');
    rowNumberCell.className = 'bg-slate-800 p-2 text-slate-400 text-sm text-center select-none';
    rowNumberCell.textContent = rowCount++;
    row.appendChild(rowNumberCell);

    // Data Columns
    data.forEach((value, index) => {
        const cell = document.createElement('div');
        cell.className = 'bg-slate-800 h-12 relative cell-container';

        const cellContent = document.createElement('div');
        cellContent.className = 'cell-content';

        const hoverIndicator = document.createElement('div');
        hoverIndicator.className = 'hover-indicator';
        cell.appendChild(hoverIndicator);

        if(index === 3 && value === 'Cash') { // Payment Type Column
            const select = document.createElement('select');
            select.className = 'payment-select text-sm text-center w-full mx-2';
            select.addEventListener('focus', () => cell.classList.add('selected-cell'));
            select.addEventListener('blur', () => cell.classList.remove('selected-cell'));

            select.addEventListener('change', () => calculateTotals());

            const defaultOption = document.createElement('option');
            defaultOption.value = value;
            defaultOption.textContent = value;
            defaultOption.hidden = true;
            select.appendChild(defaultOption);

            paymentTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                select.appendChild(option);
            });

            select.value = value;
            cellContent.appendChild(select);
        }
        else if(index === 4 && value === true) { // Is Installment Column
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'w-4 h-4 rounded bg-slate-700 border-slate-600 text-sky-400 focus:ring-sky-400';
            checkbox.checked = value;
            checkbox.addEventListener('change', () => calculateTotals());
            cellContent.appendChild(checkbox);
        }
        else if (index === 5 && !isNaN(new Date(value).getDate())) { // Date Column
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.className = 'text-slate-300 text-sm w-full text-center border-none outline-none';
            dateInput.value = value;
            dateInput.max = new Date().toISOString().split('T')[0];
            dateInput.addEventListener('keydown', (e) => e.preventDefault());
            cellContent.appendChild(dateInput);
        }
        else {
            const editableDiv = document.createElement('div');
            editableDiv.className = 'text-slate-300 text-sm w-full text-center outline-none';
            editableDiv.contentEditable = isCellsEditable;
            editableDiv.textContent = value;

            if(index === 2) { // Amount Column
                editableDiv.classList.add('text-green-400');
                editableDiv.addEventListener('input', () => calculateTotals());
            }
            else if (index === 4) {
                editableDiv.addEventListener('input', () => calculateTotals());
            }
            cellContent.appendChild(editableDiv);
        }

        cell.addEventListener('click', () => {
            document.querySelectorAll('.selected-cell').forEach(el => el.classList.remove('selected-cell'));
            cell.classList.add('selected-cell');
        });

        cell.appendChild(cellContent);
        row.appendChild(cell);
    });
    return row;
}

function initializeEditor() {
    const spreadsheet = document.getElementById('spreadsheet');
    spreadsheet.innerHTML = '';
    rowCount = 1;

    currentData.forEach(rowData => {
        spreadsheet.appendChild(createRow(rowData));
    });
    document.getElementById('rowCount').textContent = currentData.length;
    calculateTotals();
}

// toggle editor mode in cells
function editorMode(isTrue=false) {
    const rowsElements = document.querySelectorAll('#spreadsheet > .contents');
    
    rowsElements.forEach(row => {
        const cells = Array.from(row.children).slice(1);
        const rowData = Array.from(cells).map(cell => {
            const select = cell.querySelector('select');
            const dateInput = cell.querySelector('input[type="date"]');
            if(select) return;
            if(dateInput) return;
            
            let editableElement = cell.querySelector(`[contenteditable='${isCellsEditable}']`);
            if (editableElement) {
                editableElement.contentEditable = isTrue;
            }
        });
    });
    isCellsEditable = isTrue;
}

function toggleEditMode(isChecked) {
    if (isChecked) {
        editorMode(true);
    } else {
        editorMode(false);
    }
}

// Modified addNewRow function
function addNewRow() {
    const spreadsheet = document.getElementById('spreadsheet');
    const totalRows = document.querySelectorAll('#spreadsheet > .contents:nth-last-child(-n+6)');
    
    // Insert before total rows
    spreadsheet.insertBefore(createRow(), totalRows[0]);
    document.getElementById('rowCount').textContent = rowCount - 1;
}