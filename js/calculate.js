const fixedRows = 6;

function calculateTotals() {
    let totalAmount = 0;
    let totalCash = 0;
    let totalBkash = 0;
    let totalCard = 0;

    let collectionAmount = 0;
    let collectionAccount = 0;

    let totalExpense = 0;

    const rows = document.querySelectorAll('#spreadsheet > .contents');
    rows.forEach((row, index) => {
        if (index <= rows.length - fixedRows) { // avoid last 6 rows from this calculation
            const amountCell = row.children[3].querySelector(`[contenteditable="${isCellsEditable}"]`);
            const paymentTypeSelect = row.children[4].querySelector('select');
            
            const amount = parseInt(amountCell.textContent.replace(/[^0-9.]/g, '')) || 0;
            const paymentType = paymentTypeSelect ? paymentTypeSelect.value : 'Cash';

            totalAmount += amount;
            if (paymentType === 'Cash') totalCash += amount;
            if (paymentType === 'Bkash') totalBkash += amount;
            if (paymentType === 'Card') totalCard += amount;

            const checkbox = row.children[5].querySelector('input[type="checkbox"]');
            const isInstallment = checkbox ? checkbox.checked : false;
            if (isInstallment) {
                collectionAmount += amount;
                collectionAccount += 1;
            }
        } else if (index >= rows.length - fixedRows) { //calculate only last 6 rows
            const expAmountCell = row.children[5].querySelector(`[contenteditable="${isCellsEditable}"]`);
            const expAmount = parseInt(expAmountCell.textContent.replace(/[^0-9.]/g, '')) || 0;
            totalExpense += expAmount;
        }
    });

    // Update total rows
    const totalRows = document.querySelectorAll(`#spreadsheet > .contents:nth-last-child(-n+${fixedRows})`);
    
    totalRows[0].children[2].querySelector(`[contenteditable="${isCellsEditable}"]`).textContent = totalAmount;
    totalRows[2].children[2].querySelector(`[contenteditable="${isCellsEditable}"]`).textContent = totalCash - totalExpense;
    
    totalRows[3].children[2].querySelector(`[contenteditable="${isCellsEditable}"]`).textContent = totalBkash;
    totalRows[4].children[2].querySelector(`[contenteditable="${isCellsEditable}"]`).textContent = totalCard;
    totalRows[5].children[2].querySelector(`[contenteditable="${isCellsEditable}"]`).textContent = totalExpense;
    
    totalRows[1].children[7].querySelector(`[contenteditable="${isCellsEditable}"]`).textContent = collectionAmount;
    totalRows[3].children[7].querySelector(`[contenteditable="${isCellsEditable}"]`).textContent = collectionAccount;
}