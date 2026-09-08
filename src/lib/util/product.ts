import { HttpTypes } from "@medusajs/types";
import { visibleProductOptions } from "./product-options";

export const isSimpleProduct = (product: HttpTypes.StoreProduct): boolean => {
    return visibleProductOptions(product.options).length === 0;
}
