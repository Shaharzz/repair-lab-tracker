import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Cpu, Loader2, LogOut, PackageSearch, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTickets } from '@/context/TicketContext';
import type { Tables } from '@/integrations/supabase/types';
import { StaggeredMenu } from '@/components/StaggeredMenu';
import { InviteAdminDialog } from '@/components/InviteAdminDialog';
import { NewTicketDialog } from '@/components/NewTicketDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-reveal-up">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="tech-glow flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Cpu className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold">RepairLab Admin</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  type SortMode = 'model-asc' | 'model-desc' | 'qty-desc' | 'qty-asc';
  type InventoryDraft = {
    item_name: string;
    fit_for: string;
    category: string;
    sku: string;
    quantity: string;
    min_quantity: string;
    cost_price: string;
    retail_price: string;
    supplier: string;
  };

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { tickets } = useTickets();
  const [inventoryRows, setInventoryRows] = useState<Tables<'inventory'>[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('model-asc');
  const [editDrafts, setEditDrafts] = useState<Record<string, InventoryDraft>>({});
  const [newItem, setNewItem] = useState({
    item_name: '',
    fit_for: '',
    category: '',
    sku: '',
    quantity: '0',
    min_quantity: '0',
    cost_price: '',
    retail_price: '',
    supplier: ''
  });

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const rowToDraft = (row: Tables<'inventory'>): InventoryDraft => ({
    item_name: row.item_name,
    fit_for: row.fit_for ?? '',
    category: row.category ?? '',
    sku: row.sku ?? '',
    quantity: String(row.quantity),
    min_quantity: String(row.min_quantity),
    cost_price: row.cost_price === null ? '' : String(row.cost_price),
    retail_price: row.retail_price === null ? '' : String(row.retail_price),
    supplier: row.supplier ?? ''
  });

  const groupedFromTickets = useMemo(() => {
    const map = new Map<string, number>();
    for (const ticket of tickets) {
      const key = ticket.deviceModel?.trim() || 'Unknown device';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([item_name, quantity]) => ({ item_name, quantity }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [tickets]);

  const fetchInventory = async () => {
    setInventoryLoading(true);
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('quantity', { ascending: false })
      .order('item_name', { ascending: true });

    if (error) {
      toast.error(error.message);
      setInventoryLoading(false);
      return;
    }

    setInventoryRows(data || []);
    setSelectedIds(prev => prev.filter(id => (data || []).some(row => row.id === id)));
    setInventoryLoading(false);
  };

  const sortedRows = useMemo(() => {
    const rows = [...inventoryRows];
    rows.sort((a, b) => {
      if (sortMode === 'model-asc') {
        return a.item_name.localeCompare(b.item_name, undefined, { sensitivity: 'base' });
      }
      if (sortMode === 'model-desc') {
        return b.item_name.localeCompare(a.item_name, undefined, { sensitivity: 'base' });
      }
      if (sortMode === 'qty-asc') {
        return a.quantity - b.quantity;
      }
      return b.quantity - a.quantity;
    });
    return rows;
  }, [inventoryRows, sortMode]);

  const allSelected = sortedRows.length > 0 && selectedIds.length === sortedRows.length;

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(sortedRows.map(row => row.id));
      return;
    }
    setSelectedIds([]);
  };

  const toggleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds(prev => (checked ? [...prev, id] : prev.filter(v => v !== id)));
  };

  const handleDeleteItems = async (ids: string[]) => {
    if (ids.length === 0) return;
    setDeleting(true);
    const { error } = await supabase.from('inventory').delete().in('id', ids);
    setDeleting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    await fetchInventory();
    toast.success(ids.length === 1 ? 'Item deleted.' : `${ids.length} items deleted.`);
  };

  const handleDeleteSingle = async (id: string, itemName: string) => {
    const confirmed = window.confirm(`Delete inventory item "${itemName}"?`);
    if (!confirmed) return;
    await handleDeleteItems([id]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(`Delete ${selectedIds.length} selected item(s)?`);
    if (!confirmed) return;
    await handleDeleteItems(selectedIds);
  };

  const handleAddInventory = async () => {
    const itemName = newItem.item_name.trim();
    if (!itemName) {
      toast.error('Item name is required.');
      return;
    }

    const quantity = Number.parseInt(newItem.quantity, 10);
    const minQuantity = Number.parseInt(newItem.min_quantity, 10);
    const costPrice = newItem.cost_price.trim() ? Number.parseFloat(newItem.cost_price) : null;
    const retailPrice = newItem.retail_price.trim() ? Number.parseFloat(newItem.retail_price) : null;

    if (Number.isNaN(quantity) || quantity < 0) {
      toast.error('Quantity must be a valid non-negative number.');
      return;
    }

    if (Number.isNaN(minQuantity) || minQuantity < 0) {
      toast.error('Min quantity must be a valid non-negative number.');
      return;
    }

    setAdding(true);
    const { error } = await supabase.from('inventory').insert({
      item_name: itemName,
      fit_for: newItem.fit_for.trim() || null,
      category: newItem.category.trim() || null,
      sku: newItem.sku.trim() || null,
      quantity,
      min_quantity: minQuantity,
      cost_price: costPrice,
      retail_price: retailPrice,
      supplier: newItem.supplier.trim() || null
    });
    setAdding(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setNewItem({
      item_name: '',
      fit_for: '',
      category: '',
      sku: '',
      quantity: '0',
      min_quantity: '0',
      cost_price: '',
      retail_price: '',
      supplier: ''
    });

    await fetchInventory();
    toast.success('Inventory item added.');
  };

  const updateDraft = (id: string, field: keyof InventoryDraft, value: string) => {
    setEditDrafts(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {
          item_name: '',
          fit_for: '',
          category: '',
          sku: '',
          quantity: '0',
          min_quantity: '0',
          cost_price: '',
          retail_price: '',
          supplier: ''
        }),
        [field]: value
      }
    }));
  };

  const handleSaveRow = async (row: Tables<'inventory'>) => {
    const draft = editDrafts[row.id] || rowToDraft(row);
    const itemName = draft.item_name.trim();
    const quantity = Number.parseInt(draft.quantity, 10);
    const minQuantity = Number.parseInt(draft.min_quantity, 10);
    const costPrice = draft.cost_price.trim() ? Number.parseFloat(draft.cost_price) : null;
    const retailPrice = draft.retail_price.trim() ? Number.parseFloat(draft.retail_price) : null;

    if (!itemName) {
      toast.error('Item name is required.');
      return;
    }
    if (Number.isNaN(quantity) || quantity < 0) {
      toast.error('Quantity must be a valid non-negative number.');
      return;
    }
    if (Number.isNaN(minQuantity) || minQuantity < 0) {
      toast.error('Min quantity must be a valid non-negative number.');
      return;
    }
    if ((draft.cost_price.trim() && Number.isNaN(costPrice as number)) || (draft.retail_price.trim() && Number.isNaN(retailPrice as number))) {
      toast.error('Cost and retail prices must be valid numbers.');
      return;
    }

    setSavingRowId(row.id);
    const { data, error } = await supabase
      .from('inventory')
      .update({
        item_name: itemName,
        fit_for: draft.fit_for.trim() || null,
        category: draft.category.trim() || null,
        sku: draft.sku.trim() || null,
        quantity,
        min_quantity: minQuantity,
        cost_price: costPrice,
        retail_price: retailPrice,
        supplier: draft.supplier.trim() || null
      })
      .eq('id', row.id)
      .select('*')
      .single();
    setSavingRowId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    setInventoryRows(prev => prev.map(item => (item.id === row.id ? data : item)));
    setEditDrafts(prev => ({ ...prev, [row.id]: rowToDraft(data) }));
    toast.success('Item updated.');
  };

  const handleSyncFromTickets = async () => {
    if (groupedFromTickets.length === 0) {
      toast.info('No tickets available to sync.');
      return;
    }

    setSyncing(true);

    const { data: existingRows, error: existingError } = await supabase
      .from('inventory')
      .select('id, item_name');

    if (existingError) {
      setSyncing(false);
      toast.error(existingError.message);
      return;
    }

    const existingByName = new Map(
      (existingRows || []).map(row => [row.item_name.trim().toLowerCase(), row.id] as const)
    );

    const updates: Promise<void>[] = [];
    const inserts: Array<{ item_name: string; quantity: number; category: string; min_quantity: number }> = [];

    for (const item of groupedFromTickets) {
      const key = item.item_name.trim().toLowerCase();
      const existingId = existingByName.get(key);

      if (existingId) {
        updates.push(
          supabase
            .from('inventory')
            .update({ quantity: item.quantity })
            .eq('id', existingId)
            .then(({ error }) => {
              if (error) throw error;
              return;
            })
        );
      } else {
        inserts.push({
          item_name: item.item_name,
          quantity: item.quantity,
          category: 'Devices',
          min_quantity: 0
        });
      }
    }

    try {
      await Promise.all(updates);
      if (inserts.length > 0) {
        const { error: insertError } = await supabase.from('inventory').insert(inserts);
        if (insertError) throw insertError;
      }
    } catch (error) {
      setSyncing(false);
      toast.error(error instanceof Error ? error.message : 'Failed to sync inventory.');
      return;
    }

    setSyncing(false);

    await fetchInventory();
    toast.success('Inventory synced from tickets.');
  };

  useEffect(() => {
    if (!session) return;
    void fetchInventory();
  }, [session]);

  useEffect(() => {
    setEditDrafts(prev => {
      const next: Record<string, InventoryDraft> = {};
      for (const row of inventoryRows) {
        next[row.id] = prev[row.id] || rowToDraft(row);
      }
      return next;
    });
  }, [inventoryRows]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  const menuItems = [
    { label: 'Welcome', ariaLabel: 'Go to welcome page', link: '/admin' },
    { label: 'Tickets', ariaLabel: 'Go to tickets page', link: '/admin/tickets' },
    { label: 'Inventory', ariaLabel: 'Go to inventory page', link: '/admin/inventory' },
    { label: 'Invoice', ariaLabel: 'Go to invoice page', link: '/admin/invoice' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <StaggeredMenu
        isFixed
        position="left"
        items={menuItems}
        displaySocials={false}
        displayLogo={false}
        menuButtonColor="#0f172a"
        changeMenuColorOnOpen={false}
      />

      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <span className="font-semibold">RepairLab Inventory</span>
          </div>
          <div className="flex items-center gap-2">
            <NewTicketDialog />
            <InviteAdminDialog />
            <Button size="icon" variant="ghost" onClick={handleLogout} className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 p-4">
        <div className="surface-elevated rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Device Inventory Overview</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Inventory is now linked to the dedicated inventory table in Supabase.
          </p>
          <div className="mt-3">
            <Button onClick={() => void handleSyncFromTickets()} disabled={syncing}>
              {syncing && <Loader2 className="h-4 w-4 animate-spin" />}
              Sync from Tickets
            </Button>
          </div>
        </div>

        <div className="surface-elevated rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Add Inventory</h2>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-model" className="text-xs text-muted-foreground">Sort</label>
              <select
                id="sort-model"
                className="rounded-md border bg-background px-2 py-1 text-sm"
                value={sortMode}
                onChange={e => setSortMode(e.target.value as SortMode)}
              >
                <option value="model-asc">Model A-Z</option>
                <option value="model-desc">Model Z-A</option>
                <option value="qty-desc">Quantity High-Low</option>
                <option value="qty-asc">Quantity Low-High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Item Name (Product title)</p>
              <Input
                placeholder="iPhone 14 Screen"
                value={newItem.item_name}
                onChange={e => setNewItem(prev => ({ ...prev, item_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Fit For (Compatible model)</p>
              <Input
                placeholder="iPhone 14"
                value={newItem.fit_for}
                onChange={e => setNewItem(prev => ({ ...prev, fit_for: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Category (Part type)</p>
              <Input
                placeholder="Screens"
                value={newItem.category}
                onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">SKU (Internal code)</p>
              <Input
                placeholder="SCR-IP14-001"
                value={newItem.sku}
                onChange={e => setNewItem(prev => ({ ...prev, sku: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Quantity (Units in stock)</p>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={newItem.quantity}
                onChange={e => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Min Quantity (Low-stock alert)</p>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={newItem.min_quantity}
                onChange={e => setNewItem(prev => ({ ...prev, min_quantity: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Cost Price (Your buy price)</p>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={newItem.cost_price}
                onChange={e => setNewItem(prev => ({ ...prev, cost_price: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Retail Price (Sale price)</p>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={newItem.retail_price}
                onChange={e => setNewItem(prev => ({ ...prev, retail_price: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Supplier (Vendor name)</p>
              <Input
                placeholder="Mobile Parts Ltd"
                value={newItem.supplier}
                onChange={e => setNewItem(prev => ({ ...prev, supplier: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-3">
            <Button onClick={() => void handleAddInventory()} disabled={adding}>
              {adding && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Inventory
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="destructive" onClick={() => void handleBulkDelete()} disabled={selectedIds.length === 0 || deleting}>
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Bulk Delete {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
          </Button>
        </div>

        <div className="surface-elevated overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 px-4 py-3 text-left font-medium text-muted-foreground">
                  <input
                    type="checkbox"
                    aria-label="Select all inventory rows"
                    checked={allSelected}
                    onChange={e => toggleSelectAll(e.target.checked)}
                    disabled={inventoryLoading || deleting || sortedRows.length === 0}
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Item</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fit For</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Quantity</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Min</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cost</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Retail</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Supplier</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventoryLoading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : (
                sortedRows.map(row => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${row.item_name}`}
                        checked={selectedIds.includes(row.id)}
                        onChange={e => toggleSelectRow(row.id, e.target.checked)}
                        disabled={deleting}
                      />
                    </td>
                    <td className="px-4 py-3"><Input value={editDrafts[row.id]?.item_name ?? row.item_name} onChange={e => updateDraft(row.id, 'item_name', e.target.value)} className="h-8" /></td>
                    <td className="px-4 py-3"><Input value={editDrafts[row.id]?.fit_for ?? (row.fit_for || '')} onChange={e => updateDraft(row.id, 'fit_for', e.target.value)} className="h-8" /></td>
                    <td className="px-4 py-3"><Input value={editDrafts[row.id]?.category ?? (row.category || '')} onChange={e => updateDraft(row.id, 'category', e.target.value)} className="h-8" /></td>
                    <td className="px-4 py-3"><Input value={editDrafts[row.id]?.sku ?? (row.sku || '')} onChange={e => updateDraft(row.id, 'sku', e.target.value)} className="h-8 font-mono text-xs" /></td>
                    <td className="px-4 py-3"><Input type="number" min={0} value={editDrafts[row.id]?.quantity ?? String(row.quantity)} onChange={e => updateDraft(row.id, 'quantity', e.target.value)} className="h-8" /></td>
                    <td className="px-4 py-3"><Input type="number" min={0} value={editDrafts[row.id]?.min_quantity ?? String(row.min_quantity)} onChange={e => updateDraft(row.id, 'min_quantity', e.target.value)} className="h-8" /></td>
                    <td className="px-4 py-3"><Input type="number" min={0} step="0.01" value={editDrafts[row.id]?.cost_price ?? (row.cost_price === null ? '' : String(row.cost_price))} onChange={e => updateDraft(row.id, 'cost_price', e.target.value)} className="h-8" /></td>
                    <td className="px-4 py-3"><Input type="number" min={0} step="0.01" value={editDrafts[row.id]?.retail_price ?? (row.retail_price === null ? '' : String(row.retail_price))} onChange={e => updateDraft(row.id, 'retail_price', e.target.value)} className="h-8" /></td>
                    <td className="px-4 py-3"><Input value={editDrafts[row.id]?.supplier ?? (row.supplier || '')} onChange={e => updateDraft(row.id, 'supplier', e.target.value)} className="h-8" /></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Button size="sm" disabled={savingRowId === row.id || deleting} onClick={() => void handleSaveRow(row)}>
                          {savingRowId === row.id && <Loader2 className="h-4 w-4 animate-spin" />}
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deleting || savingRowId === row.id}
                          onClick={() => void handleDeleteSingle(row.id, row.item_name)}
                        >
                          Delete Item
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!inventoryLoading && inventoryRows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">
                    No inventory data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}








