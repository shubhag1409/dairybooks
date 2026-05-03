
## Inventory Feature

### What it does
- **Auto-stock from purchases**: When a purchase is saved, those quantities are added to inventory.
- **Auto-deduct from sales**: When a sale is saved, sold quantities are subtracted from inventory.
- **Inventory page**: Shows current stock per product (computed from all inventory movements). User can pick a date to see that day's snapshot.
- **Manual removal**: User can remove stock manually with a reason (spoilage, expired, damaged, other).

### Database changes

Create one new table `inventory_adjustments` to track all inventory movements:

```sql
CREATE TABLE public.inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,        -- positive = stock in, negative = stock out
  reason text NOT NULL,                        -- 'purchase', 'sale', 'spoilage', 'expired', 'damaged', 'other'
  reference_id uuid,                           -- optional link to purchase_id or sale_id
  note text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS policies (own data only)
CREATE POLICY "own inventory select" ON public.inventory_adjustments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own inventory insert" ON public.inventory_adjustments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own inventory delete" ON public.inventory_adjustments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "own inventory update" ON public.inventory_adjustments FOR UPDATE USING (auth.uid() = user_id);
```

### Code changes

1. **`src/pages/Purchases.tsx`** -- After saving a purchase, insert inventory_adjustments rows (one per product with qty > 0, reason = 'purchase', reference_id = purchase.id).

2. **`src/pages/Sales.tsx`** -- After saving a sale, insert inventory_adjustments rows (one per product with qty > 0, as negative quantity, reason = 'sale', reference_id = sale.id).

3. **`src/pages/Inventory.tsx`** (new) -- New page showing:
   - Current stock per product (sum of all adjustments per product_id)
   - Date filter to see movements on a specific date
   - A "Remove Stock" button/modal where user selects a product, enters quantity, picks a reason (Spoilage / Expired / Damaged / Other), and optionally adds a note
   - Recent adjustment history log

4. **`src/components/Sidebar.tsx`** -- Add "Inventory" link under Tracking section.

5. **`src/App.tsx`** -- Add `/inventory` route.

### Technical details
- Inventory is computed as `SUM(quantity)` grouped by `product_id` from `inventory_adjustments` -- no separate "current stock" column to keep out of sync.
- Purchase deletions and sale deletions should also clean up corresponding adjustment rows (by `reference_id`).
