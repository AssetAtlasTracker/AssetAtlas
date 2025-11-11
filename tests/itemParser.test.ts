import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import BasicItem from "$lib/server/db/models/basicItem.js";
import CustomField, { type ICustomField } from "$lib/server/db/models/customField.js";
import { test } from "$lib/utility/index.js";

const resources = test();
const CSVItemParser = resources.itemParser;
const FileLoader = resources.loader;

describe("Testing Item Parsing", () => {

	it("Should make one item with all types of fields, no template", async () => {
		const csvContent = `item name,template,description,amount,seller,sold\ncat,,a black cat,1,barbra,false`;

		const itemParser = new CSVItemParser([], [], []);
		const canParse = itemParser.canParse(csvContent.split(/\n|\r/)[0].split(/,/));
		expect(canParse).toBeTruthy();

		itemParser.parse(csvContent);

		const firstItem = new BasicItem();
		firstItem.name = "cat";
		firstItem.template = undefined;
		firstItem.description = "a black cat";

		const fieldMap = new Map<Types.ObjectId, ICustomField>();
		firstItem.customFields = [];
		const amountField = new CustomField();
		amountField.id = 20;
		amountField.fieldName = "amount";
		amountField.dataType = "number";
		fieldMap.set(amountField.id, amountField);
		firstItem.customFields.push({ field: amountField.id, value: "1" });
		const sellerField = new CustomField();
		sellerField.id = 21;
		sellerField.fieldName = "seller";
		sellerField.dataType = "string";
		fieldMap.set(sellerField.id, sellerField);
		firstItem.customFields.push({ field: sellerField.id, value: "barbra" });
		const soldField = new CustomField();
		soldField.id = 22;
		soldField.fieldName = "sold";
		soldField.dataType = "boolean";
		fieldMap.set(soldField.id, soldField);
		firstItem.customFields.push({ field: soldField.id, value: "false" });


		expect(itemParser.itemTree.length == 1);
		const parsedItem = itemParser.itemTree[0];
		expect(parsedItem.name).toBe(firstItem.name);
		expect(parsedItem.template).toBe(firstItem.template);
		expect(parsedItem.description).toBe(firstItem.description);
		expect(parsedItem.customFields).not.toBeNull();
		expect(parsedItem.customFields!.length).toBe(3);

		for (let i = 0; i < parsedItem.customFields!.length; i++) {
			const parsedField = parsedItem.customFields![i];
			const field = firstItem.customFields[i];
			if (i === 0) {
				const fieldId = field.field;
				expect(fieldId).toStrictEqual(amountField._id);
			}
			const _ids = fieldMap.keys();
			const _idSTr = field.field.toHexString();
			const fieldCustom = fieldMap.get(field.field.toHexString() as unknown as Types.ObjectId);
			expect(fieldCustom).not.toBe(undefined);
			const _parsedIds = itemParser.customFieldMap.keys();
			const _parsedIdStr = parsedField.field.toHexString();
			const parsedFieldCustom = itemParser.customFieldMap.get(parsedField.field.toHexString() as unknown as Types.ObjectId);
			expect(parsedFieldCustom).not.toBe(undefined);
			expect(parsedFieldCustom!.fieldName).toBe(fieldCustom!.fieldName);
			expect(parsedFieldCustom!.dataType).toBe(fieldCustom!.dataType)
			expect(parsedField.value).toBe(field.value);
		}

	});

	it("Should parse an item with a subitem from a file", async () => {
		const path = "./tests/resource/test-csv-item-1.csv";
		const loader = new FileLoader();
		const content = await loader.readFile(path);
		const itemParser = new CSVItemParser([], [], []);

		const canParse = itemParser.canParse(content.split(/\n|\r/)[0].split(/,/));
		expect(canParse).toBeTruthy();

		// parse and get results
		itemParser.parse(content);
		const items = itemParser.itemTree;
		const itemMap = itemParser.itemMap;

		// check items
		// -- first item

		expect(items.length === 2);
		expect(Array.from(itemMap.keys()).length === 3);


		const firstItem = items[0];
		expect(firstItem).not.toBeNull();
		expect(firstItem!.name).toBe('one');
		expect(firstItem!.description).toBe('a number');
		expect(firstItem!.customFields).not.toBeNull();
		expect(firstItem!.customFields![0].value).toBe('1');

		// -- second item
		const secondItem = itemMap.get(firstItem.containedItems![0].toHexString() as unknown as Types.ObjectId);
		expect(secondItem).not.toBeNull();
		expect(secondItem!.name).toBe('two');
		expect(secondItem!.description).toBe('another number');
		expect(secondItem!.customFields).not.toBeNull();
		expect(secondItem!.customFields![0].value).toBe('2');

		// -- third item
		const thirdItem = items[1];
		expect(thirdItem).not.toBeNull();
		expect(thirdItem!.name).toBe('three');
		expect(thirdItem!.description).toBe('a third number');
		expect(thirdItem!.customFields).not.toBeNull();
		expect(thirdItem!.customFields![0].value).toBe('3');

		// check item relations
		const parentItem = items[0];
		expect(parentItem).toBe(firstItem);
		expect(parentItem.containedItems).not.toBeNull();
		expect(parentItem.containedItems![0]).toStrictEqual(secondItem!._id);
	});
});