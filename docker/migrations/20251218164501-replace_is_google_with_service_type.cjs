const ServiceType = {
    GITHUB: 'github',
    GOOGLE: 'google'
};

module.exports = {
	/**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
	async up(db, client) {
		await db.collection('logins').updateMany(
			{ is_google: { $exists: true } },
			[
				{
					$set: {
						service_type: {
							$cond: {
								if: { $eq: ["$is_google", true] },
								then: ServiceType.GOOGLE,
								else: {
									$ifNull: ["$rollback_type", ServiceType.GITHUB]
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
								
								if: { $or: [
									{ $eq: ["$service_type", ServiceType.GOOGLE] },
									{ $eq: ["$service_type", "google"] }
								]},
								then: true,
								else: false
							}
						},
						rollback_type: {
							$cond: {
								if: { $or: [
									{ $ne: ["$service_type", ServiceType.GOOGLE] },
									{ $ne: ["$service_type", "google"] }
								]},
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
