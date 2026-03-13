module.exports = {
	/**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
	async up(db, client) {
		const basicItemsCollection = db.collection('basicitems');
    
		// Find all items where template exists as ObjectId (old format)
		const itemsWithOldTemplate = await basicItemsCollection.find({
			template: { $exists: true, $type: 'objectId' }
		}).toArray();
    
		console.log(`Found ${itemsWithOldTemplate.length} items with old template format (ObjectId)`);
    
		// Convert ObjectId to array format
		for (const item of itemsWithOldTemplate) {
			const oldTemplateId = item.template;
			const newTemplatesFormat = [{
				field: oldTemplateId
			}];
        
			await basicItemsCollection.updateOne(
				{ _id: item._id },
				{ $set: { templates: newTemplatesFormat }, $unset: { template: "" } }
			);
        
			console.log(`Updated item ${item._id} from ObjectId to templates array format`);
		}
		
		// Find all items where template already exists as array (current format)
		const itemsWithArrayTemplate = await basicItemsCollection.find({
			template: { $exists: true, $type: 'array' }
		}).toArray();
		
		console.log(`Found ${itemsWithArrayTemplate.length} items with template already as array`);
		
		// Rename template field to templates
		for (const item of itemsWithArrayTemplate) {
			await basicItemsCollection.updateOne(
				{ _id: item._id },
				{ $rename: { template: 'templates' } }
			);
			
			console.log(`Renamed template to templates for item ${item._id}`);
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
    
		console.log(`Found ${itemsWithNewTemplates.length} items with templates field`);
    
		// Convert templates array back to single template ObjectId
		for (const item of itemsWithNewTemplates) {
			if (item.templates && item.templates.length > 0 && item.templates[0].field) {
				// Extract the first template's field ObjectId
				const firstTemplateId = item.templates[0].field;
				
				await basicItemsCollection.updateOne(
					{ _id: item._id },
					{ $set: { template: firstTemplateId }, $unset: { templates: "" } }
				);
				
				console.log(`Converted item ${item._id} from templates array to single template ObjectId`);
			} else {
				// Empty or invalid templates array, just remove it
				await basicItemsCollection.updateOne(
					{ _id: item._id },
					{ $unset: { templates: "" } }
				);
				
				console.log(`Removed empty templates array from item ${item._id}`);
			}
		}
    
		console.log('Rollback completed successfully');
	}
};
