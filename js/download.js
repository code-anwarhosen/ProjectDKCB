function downloadFile() {
    const rows = [];
    const rowsElements = document.querySelectorAll('#spreadsheet > .contents');
    
    rowsElements.forEach(row => {
        const cells = Array.from(row.children).slice(1);

        const rowData = Array.from(cells).map(cell => {
            const select = cell.querySelector('select');
            const checkbox = cell.querySelector('input[type="checkbox"]');
            const dateInput = cell.querySelector('input[type="date"]');

            if(select) return select.value;
            if(checkbox) return checkbox.checked;
            if(dateInput) return dateInput.value;
            return cell.textContent;
        });
        rows.push(rowData);
    });

    const ws = XLSX.utils.aoa_to_sheet([
        ['Cash A/C', 'Hire A/C', 'Amount', 'Payment Type', 'Installment', 'Date', 'Remarks'],
        ...rows
    ]);

    ws['!cols'] = [
        {wch: 12}, {wch: 12}, {wch: 15}, 
        {wch: 15}, {wch: 15}, {wch: 12}, {wch: 25}
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    let filename = document.getElementById('working_date').value;
    XLSX.writeFile(wb, filename+'.xlsx');
}