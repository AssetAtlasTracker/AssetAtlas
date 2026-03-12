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
			const newTemplateFormat = [{
				field: oldTemplateId,
				value: null
			}];
        
			await basicItemsCollection.updateOne(
				{ _id: item._id },
				{ $set: { template: newTemplateFormat } }
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
    
		const itemsWithNewTemplate = await basicItemsCollection.find({
			template: { $exists: true, $type: 'array' }
		}).toArray();
    
		// Convert each item's template from array back to single ObjectId
		// Takes the first template in the array
		for (const item of itemsWithNewTemplate) {
			if (item.template && item.template.length > 0) {
				// Get the first template's ObjectId from the array
				const firstTemplateId = item.template[0].field;
        
				await basicItemsCollection.updateOne(
					{ _id: item._id },
					{ $set: { template: firstTemplateId } }
				);
        
			} else {
				await basicItemsCollection.updateOne(
					{ _id: item._id },
					{ $unset: { template: "" } }
				);
        
			}
		}
    
		console.log('Rollback completed successfully');
	}
};
