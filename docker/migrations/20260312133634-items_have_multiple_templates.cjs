module.exports = {
	/**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
	async up(db, client) {
		const basicItemsCollection = db.collection('basicitems');
    
		const itemsWithOldTemplate = await basicItemsCollection.find({
			template: { $exists: true, $type: 'objectId' }
		}).toArray();
    
		for (const item of itemsWithOldTemplate) {
			const oldTemplateId = item.template;
      
			// Wrap the template ID in the new array format: [{ field: templateId, value: null }]
			const newTemplatesFormat = [{
				field: oldTemplateId,
				value: null
			}];
        
			await basicItemsCollection.updateOne(
				{ _id: item._id },
				{ $set: { templates: newTemplatesFormat }, $unset: { template: "" } }
			);
        
		}
    
		console.log('Migration completed successfully');
	},

	/**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
	async down(db, client) {
		const basicItemsCollection = db.collection('basicitems');
    
		const itemsWithNewTemplates = await basicItemsCollection.find({
			templates: { $exists: true, $type: 'array' }
		}).toArray();
    
		// Convert each item's templates from array back to single ObjectId
		// Takes the first template in the array
		for (const item of itemsWithNewTemplates) {
			if (item.templates && item.templates.length > 0) {
				// Get the first template's ObjectId from the array
				const firstTemplateId = item.templates[0].field;
        
				await basicItemsCollection.updateOne(
					{ _id: item._id },
					{ $set: { template: firstTemplateId }, $unset: { templates: "" } }
				);
        
			} else {
				await basicItemsCollection.updateOne(
					{ _id: item._id },
					{ $unset: { templates: "" } }
				);
        
			}
		}
    
		console.log('Rollback completed successfully');
	}
};
