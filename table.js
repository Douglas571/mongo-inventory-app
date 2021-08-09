const Table = require('cli-table')

module.exports = {
    create: function(data) {
        const table = new Table({
          head: ['ID', 'Name', 'Price', 'Amount', 'Category'],
          colWidths: [4, 20, 7, 7, 20]
        })

        data.forEach((el) => {
            if(el.id == undefined) {
                el.id = '';
            }
          table.push([el.id, el.name, el.price, el.amount, el.category])
        })

        return table.toString()
    }
}