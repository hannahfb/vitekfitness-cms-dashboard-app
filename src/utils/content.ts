import { items } from "@wix/data";

export async function updateItem<T extends Record<string, any>>(
    collectionName: string,
    itemId: string,
    fieldsToUpdate:  Partial<T>
) {
    try {
        const updatedItem = await items.update(collectionName, {
            _id: itemId,
            ...fieldsToUpdate,
        });
        // console.log("Updated item:", updatedItem);
        return updatedItem;
    } catch (error) {
        console.log(`Error updating item ${itemId} in ${collectionName}:`, error);
        throw error;
    }
}