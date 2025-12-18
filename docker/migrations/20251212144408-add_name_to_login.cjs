module.exports = {
	/**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
	async up(db, client) {
		// Add name field to all logins that don't have one
		await db.collection('logins').updateMany(
			{ name: { $exists: false } },
			{ $set: { name: '' } }
		);
	},

	/**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
	async down(db, client) {
		// Remove the name field
		await db.collection('logins').updateMany(
			{},
			{ $unset: { name: '' } }
		);
	}
};