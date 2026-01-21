module.exports = {
	/**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
	async up(db, client) {
		db.collection('basicItems').find({Image: {$exists: true}}).forEach(function(item) {
			item.image = "" + item.image;
			db.collection('basicItems').save(item);
		});
	},

	/**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
	async down(db, client) {
    
	}
};
