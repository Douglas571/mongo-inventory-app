const { MongoClient } = require('mongodb');
const CLI = require('vorpal')();

class App {
	constructor(db) {
		this.db = db
		this.inventory = this.db.collection('inventory')
		this.lastId = 10000
	}

	async init() {
		this.lastId = await this.#getLastId()
	}

	async addProduct(info) {
		info.id = this.lastId + 1
		const result = await this.inventory.insertOne(info)

		if(result.acknowledged) 
			this.lastId++

		return result
	}

	async search(filter) {
		const cursor = await this.inventory
								             .find(filter)

		const results = await cursor.toArray()

		return results

	}

	async update(id, newData) {
		const updateDoc = {
			$set: newData
		}

		const result = await this.inventory
								             .updateOne({id}, updateDoc, 
                                        {upsert: false})

		return result
	}

  async delete(id) {
    const result = await this.inventory.deleteOne({id})

    return result
  }

	async getOne(id) {
		const result = await this.db
									.collection('inventory')
									.findOne({ id })
		return result

	}

	async #getLastId(){
		const cursor = await this.inventory.find({}).sort({id: -1})
		
		const firstElement = await cursor.next()

		return firstElement.id
	}
}

(async () => {

	const URL = 'mongodb://localhost:27017'
	const client = new MongoClient(URL)

	await client.connect()
	const db = client.db('pm')

	const APP = new App(db)
	await APP.init()

	// CREATE
	CLI.command('create', 'Add a product to db')
		.alias('a')
		.action((args, cb) => {
			CLI.activeCommand
				.prompt(
				[{
					type: 'input',
					name: 'name',
					message: 'Name: '
				},
				{
					type: 'input',
					name: 'amount',
					message: 'Amount:'
				},
				{
					type: 'input',
					name: 'price',
					message: 'Price ($): '
				},
				{
					type: 'input',
					name: 'category',
					message: 'Category: '
				}]).then((result) => {
					CLI.activeCommand.log(result)
					

					APP
						.addProduct(result)
						.then((insertRes) => {
							CLI.activeCommand.log(insertRes)

							cb()
						})
				})
		})

	// READ
	CLI.command('search', 'Search a product(s)')
		.alias('s')
		.option('-n, --name <name>', 'Specify the name')

		.option('-a, --amout <amount>', 'specify the amount')
		.option('-p, --price <price>', 'specify the price')

		.option('-c, --category <category>', 'specify a category')

		.action((args, cb) => {
			CLI.activeCommand.log(args)

			APP
				.search(args.options)
				.then((res) => { 
					CLI.activeCommand.log(res)

					cb()
				})

		})
	
	// UPDATE
	CLI.command('update <id>', 'Update a product')
		.alias('u')
		.action((args, cb) => {
			CLI.activeCommand.log(args)
			APP.getOne(args.id)
			.then((res) => {
				CLI.activeCommand.log(res)
				CLI.activeCommand.prompt(
					[{
						type: 'input',
						name: 'name',
						message: 'New Name: '
					},
					{
						type: 'input',
						name: 'amount',
						message: 'New Amount:'
					},
					{
						type: 'input',
						name: 'price',
						message: 'New Price ($): '
					},
					{
						type: 'input',
						name: 'category',
						message: 'New Category: '
					}])
				.then((response) => {
					APP.update(args.id, response).then((res) => {
						CLI.activeCommand.log(res)
						cb()	
					})
					
				})								
			})
			
		})

	// DELETE
	CLI.command('delete <id>', 'Delete operations')
    .alias('d')
		.action((args, cb) => {
			APP.delete(args.id)
				.then((res) => {
					CLI.activeCommand.log(`Deleted product of id: ${args.id}`)
					CLI.activeCommand.log(res)

          cb()
				})
		})

	CLI
		.delimiter('<$>')
  		.show();
})();

