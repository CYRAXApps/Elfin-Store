import { Product, CartItem } from '../types';

/**
 * Checks whether a product is currently available in stock.
 * A product is strictly out of stock if:
 * - product is null or undefined
 * - inStock is explicitly false
 * - stock is defined as a number and is <= 0
 */
export function isProductInStock(product: Partial<Product> | null | undefined): boolean {
  if (!product) return false;
  if (product.inStock === false) return false;
  if (typeof product.stock === 'number' && product.stock <= 0) return false;
  return true;
}

/**
 * Returns the effective available stock count for a product.
 * If out of stock, returns 0.
 * If stock number is provided, returns Math.max(0, product.stock).
 * If stock is undefined/null but inStock is not false, returns Infinity.
 */
export function getProductAvailableStock(product: Partial<Product> | null | undefined): number {
  if (!product || product.inStock === false) return 0;
  if (typeof product.stock === 'number') {
    return Math.max(0, product.stock);
  }
  return Infinity;
}

export interface CartStockIssue {
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableStock: number;
  reason: 'OUT_OF_STOCK' | 'INSUFFICIENT_STOCK';
}

export interface CartStockValidationResult {
  isValid: boolean;
  issues: CartStockIssue[];
}

/**
 * Validates whether all items in the cart are in stock with sufficient quantity.
 */
export function validateCartStock(cart: CartItem[]): CartStockValidationResult {
  const issues: CartStockIssue[] = [];

  for (const item of cart) {
    const product = item.product;
    const inStock = isProductInStock(product);
    const available = getProductAvailableStock(product);

    if (!inStock || available <= 0) {
      issues.push({
        productId: product.id || '',
        productName: product.name || 'Item',
        requestedQuantity: item.quantity,
        availableStock: 0,
        reason: 'OUT_OF_STOCK'
      });
    } else if (available !== Infinity && item.quantity > available) {
      issues.push({
        productId: product.id || '',
        productName: product.name || 'Item',
        requestedQuantity: item.quantity,
        availableStock: available,
        reason: 'INSUFFICIENT_STOCK'
      });
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}
