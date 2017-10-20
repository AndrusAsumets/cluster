var PouchDB = require('pouchdb')
var database = null

export function Database(uri) {
	if (!database) database = new PouchDB(uri)
	
	this.find = async (id) => {
		return await database.get(id).catch( () => null )
	}
	
	this.update = async (id, data = {}) => {
		// check if object exists
		let found = await this.find(id)
		data._id = found && found._id ? found._id : id
		
		// get revision ID (needed if we're going to update anything, not just add)
		let _rev = found && found._rev ? found._rev : null
		if (_rev) data._rev = _rev
		
		// do the edits for the object inside database
		let updated = await database.put(Object.assign({}, found, data)).catch( () => null )
		if (!updated) return null
		
		// return the updated object
		return await this.find(id)
	}
}