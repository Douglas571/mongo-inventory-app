const { MongoClient } = require('mongodb')
const Table = require('./table.js')
const CLI = require('vorpal')()

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

	async search(filter, options) {
		/*
			console.log(`the filter is: ${filter}`)
			console.log(filter)
			console.log(`the options is: ${options}`)
			console.log(options)
		*/
		

		const cursor = await this.inventory
								             .find(filter, options)

		const results = await cursor.toArray()

    return Table.create(results)
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

		if(firstElement)
			return firstElement.id
		else 
			return 0 
	}

	async getNumberOfDocs(filter) {
		const numOfDocs = await this.inventory.countDocuments(filter)

		return numOfDocs
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
		.alias('c')
		.action((args, cb) => {
			CLI.activeCommand.log('Creating a new Product:\n')
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
		//.option('-p, --price <price>', 'specify the price')

		.option('-c, --category <category>', 'specify a category')
		.option('-p, --paginate <prod>', 'specify a pagination')

		.action(async (args, cb) => {
			//CLI.activeCommand.log(args)
			CLI.activeCommand.log('The products in data base are:')

			const filter = JSON.parse(JSON.stringify(args.options))
			filter.paginate = undefined

			let options = {
				sort: { id: 1 },
				skip: 0,
				limit: args.options.paginate
				
			}

			let moreProducts = false

			let numOfDocuments = await APP.getNumberOfDocs(filter)
			let remainingProducts = numOfDocuments - args.options.paginate

			if((numOfDocuments - args.options.paginate) > 0) {
				do {

					let res = await APP.search(filter, options)
					CLI.activeCommand.log(res)

					let answer = {}

					if( remainingProducts > 0) {
						answer = await CLI.activeCommand.prompt([{
							type: 'confirm', 
							name: 'moreProducts', 
							message: `${remainingProducts} remaining products, get more?`}
						])

					} else {
						moreProducts = false
						continue
					}
						
					remainingProducts -= args.options.paginate

					if(args.options.paginate)
						options.skip += args.options.paginate

					moreProducts = answer.moreProducts


				} while(moreProducts)

				cb()
			} else {
				let res = await APP.search(filter, options)
				CLI.activeCommand.log(res)				
			}

				

		})
	
	// UPDATE
	CLI.command('update <id>', 'Update a product')
		.alias('u')
		.action((args, cb) => {
			CLI.activeCommand.log('Updating an existing product:\n')
			
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

