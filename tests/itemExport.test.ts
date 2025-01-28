import { Types } from "mongoose";
import BasicItem, { IBasicItemPopulated } from "../src/models/basicItem";
import CustomField, { ICustomField } from "../src/models/customField";

import {test} from "../src/utility"
import { CSVFormatterPopulated } from "../src/utility/formating/CSVFormatterPopulated";

const resources = test();
const FileLoader = resources.loader;
const FileExporter = resources.exporter;

describe("Testing Item Exporting", () => {

    it("Should format one item with all types of data", async () => {
        const csvContent = `item name,template,description,amount,seller,sold\ncat,,a black cat,1,barbra,false`;

        let firstItem = new BasicItem();
        firstItem.id = 1;
        firstItem.name = "cat";
        firstItem.template = undefined;
        firstItem.description = "a black cat"
        
        let fieldMap = new Map<Types.ObjectId, ICustomField>();
        firstItem.customFields = [];
        let amountField = new CustomField();
        amountField.id = 20;
        amountField.fieldName = "amount";
        amountField.dataType = "number";
        fieldMap.set(amountField.id, amountField);
        firstItem.customFields.push({field: amountField.id, value: "1"});
        let sellerField = new CustomField();
        sellerField.id = 21;
        sellerField.fieldName = "seller";
        sellerField.dataType = "string";
        fieldMap.set(sellerField.id, sellerField);
        firstItem.customFields.push({field: sellerField.id, value: "barbra"});
        let soldField = new CustomField();
        soldField.id = 22;
        soldField.fieldName = "sold";
        soldField.dataType = "boolean";
        fieldMap.set(soldField.id, soldField);
        firstItem.customFields.push({field: soldField.id, value: "false"});

        const item = firstItem as unknown as IBasicItemPopulated;

        let itemMap = new Map<Types.ObjectId,IBasicItemPopulated>();
        itemMap.set(item._id, item);
        
        const formatter = new CSVFormatterPopulated([item], [], [item]);
    
    });

    it("Should format an item with a subitem and export the content", async () => {
        const path = "./tests/resource";
        const filename = "test-csv-item-2";
        const extension = ".csv";

        const firstItem = new BasicItem() as unknown as IBasicItemPopulated;
        firstItem._id = new Types.ObjectId();
        firstItem.name = "dog";
        firstItem.template = undefined;
        firstItem.description = "a german shepherd";


        const secondItem = new BasicItem();
        secondItem._id = new Types.ObjectId();
        secondItem.name = "collar";
        secondItem.template = undefined;
        secondItem.description = "a blue collar with a dog tag";

        firstItem.containedItems = [secondItem];
        secondItem.parentItem = firstItem._id;

        const second = secondItem as unknown as IBasicItemPopulated;
        
        const formatter = new CSVFormatterPopulated([firstItem, second], [], [firstItem]);
        const result = formatter.formatItems();

        const csvContent = `item name,template,description\ndog,,a german shepherd\n>\ncollar,,a blue collar with a dog tag\n<`;
        expect(result).toBe(csvContent);
        console.log(result);

        const exporter = new FileExporter();
        exporter.export(filename, path, result.toString(), extension);

        const result2 = FileLoader.readFile(`${path}/${filename}${extension}`);
        expect(result2 == csvContent);
    });
});