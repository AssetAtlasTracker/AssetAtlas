module.exports = {
	/**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
	async up(db, client) {
		// TODO write your migration here.
		// See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
		// Example:
		// await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
		const basicItemsCollection = db.collection('basicitems');
		await basicItemsCollection.updateMany(
			{ pinned: { $exists: false } },
			{ $set: { pinned: false } }
		);
	},

	/**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
	async down(db, client) {
		const basicItemsCollection = db.collection('basicitems');
		await basicItemsCollection.updateMany(
			{ pinned: { $exists: true } },
			{ $unset: { pinned: "" } }
		);
	}
};
