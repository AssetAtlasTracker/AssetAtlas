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
    
		await db.collection('logins').updateMany(
			{ is_google: { $exists: true } },
			[
				{
					$set: {
						service_type: {
							$cond: {
								if: { $eq: ["$is_google", true] },
								then: "google",
								else: {
									$ifNull: ["$rollback_type", "github"]
								}
							}
						}
					}
				},
				{
					$unset: ["is_google", "rollback_type"]
				}
			]
		);

	},

	/**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
	async down(db, client) {
		await db.collection('logins').updateMany(
			{ service_type: { $exists: true } },
			[
				{
					$set: {
						 is_google: {
							$cond: {
								if: { $eq: ["$service_type", "google"] },
								then: true,
								else: false
							}
						},
						rollback_type: {
							$cond: {
								if: { $ne: ["$service_type", "google"] },
								then: "$service_type",
								else: "$$REMOVE"
							}
						}
					}	
				},
				{
					$unset: "service_type"
				}
			]
		);
	}
};
