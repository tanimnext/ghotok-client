import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { digits, number, taka } from '@/shared/format';
import {
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  FormMessage,
  LoadingBlock,
  Modal,
  Pill,
  TextInput,
  useToast,
} from '@/ui';
import { PageHeader } from '../components/PageHeader.jsx';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const KEY = ['packages'];
const EMPTY = {
  name: { en: '', bn: '' },
  description: { en: '', bn: '' },
  connections: 3,
  price: 300,
  sortOrder: 0,
  highlight: false,
  isActive: true,
};

function PackageForm({ pkg, onClose }) {
  const { t } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() =>
    pkg ? { ...EMPTY, ...pkg, description: { ...EMPTY.description, ...pkg.description } } : EMPTY,
  );
  const setText = (group, lang) => (e) =>
    setForm((f) => ({ ...f, [group]: { ...f[group], [lang]: e.target.value } }));
  const setNumber = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setFlag = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }));
  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: { en: form.name.en.trim(), bn: form.name.bn?.trim() || undefined },
        description: {
          en: form.description.en?.trim() || undefined,
          bn: form.description.bn?.trim() || undefined,
        },
        connections: Number(form.connections),
        price: Number(form.price),
        sortOrder: Number(form.sortOrder) || 0,
        highlight: form.highlight,
        isActive: form.isActive,
      };
      return pkg ? adminApi.updatePackage(pkg.id, body) : adminApi.createPackage(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast.success(t('common.saved'));
      onClose();
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={pkg ? t('packages.editTitle') : t('packages.createTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="package-form" loading={save.isPending}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form
        id="package-form"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="sm:col-span-2">
          <FormMessage>{save.error && errorMessage(save.error)}</FormMessage>
        </div>
        <TextInput
          label={t('packages.nameEn')}
          required
          maxLength={60}
          value={form.name.en}
          onChange={setText('name', 'en')}
        />
        <TextInput
          label={t('packages.nameBn')}
          maxLength={60}
          value={form.name.bn ?? ''}
          onChange={setText('name', 'bn')}
        />
        <TextInput
          label={t('packages.descEn')}
          maxLength={200}
          value={form.description.en ?? ''}
          onChange={setText('description', 'en')}
        />
        <TextInput
          label={t('packages.descBn')}
          maxLength={200}
          value={form.description.bn ?? ''}
          onChange={setText('description', 'bn')}
        />
        <TextInput
          label={t('packages.connections')}
          type="number"
          required
          min={1}
          max={1000}
          value={form.connections}
          onChange={setNumber('connections')}
        />
        <TextInput
          label={t('packages.price')}
          type="number"
          required
          min={1}
          value={form.price}
          onChange={setNumber('price')}
        />
        <TextInput
          label={t('packages.sortOrder')}
          type="number"
          value={form.sortOrder}
          onChange={setNumber('sortOrder')}
        />
        <div className="flex flex-col justify-end">
          <Checkbox
            label={t('packages.highlight')}
            checked={form.highlight}
            onChange={setFlag('highlight')}
          />
          <Checkbox label={t('packages.active')} checked={form.isActive} onChange={setFlag('isActive')} />
        </div>
      </form>
    </Modal>
  );
}

export function PackagesPage() {
  const { t, lang } = useT();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // a package, 'new', or null
  const [removing, setRemoving] = useState(null);
  const query = useQuery({ queryKey: KEY, queryFn: adminApi.packages });
  const remove = useMutation({
    mutationFn: () => adminApi.removePackage(removing.id),
    onSuccess: () => {
      setRemoving(null);
      queryClient.invalidateQueries({ queryKey: KEY });
    },
  });

  return (
    <>
      <PageHeader
        title={t('packages.title')}
        sub={t('packages.sub')}
        actions={<Button onClick={() => setEditing('new')}>{t('packages.new')}</Button>}
      />
      {query.isLoading ? (
        <LoadingBlock label={t('common.loading')} />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {query.data.items.map((p) => (
            <Card key={p.id} className={p.highlight ? 'border-gold' : ''}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="font-display text-2xl font-semibold">{p.name[lang] || p.name.en}</h2>
                  {p.description?.[lang] && <p className="text-sm text-muted">{p.description[lang]}</p>}
                </div>
                <span className="flex flex-col items-end gap-1">
                  {p.highlight && <Pill tone="gold">★</Pill>}
                  {!p.isActive && <Pill tone="muted">{t('packages.inactive')}</Pill>}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-4xl font-medium text-rose-text">
                  {taka(p.price, lang)}
                </span>
                <span className="text-muted">
                  {t('common.connections', { n: digits(p.connections, lang) })}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-sm text-muted">
                <span>{t('packages.perConnection', { n: number(p.perConnection, lang) })}</span>
                <span>
                  {t('packages.sold', { n: digits(p.sold, lang), revenue: number(p.revenue, lang) })}
                </span>
              </div>
              <div className="mt-auto flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                  {t('common.edit')}
                </Button>
                <Button size="sm" variant="ghost" className="text-danger" onClick={() => setRemoving(p)}>
                  {t('packages.remove')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {editing && (
        <PackageForm
          key={editing === 'new' ? 'new' : editing.id}
          pkg={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={!!removing}
        title={`${t('packages.remove')} · ${removing?.name[lang] || removing?.name.en || ''}`}
        description={t('packages.removeNote')}
        confirmLabel={t('packages.remove')}
        cancelLabel={t('common.cancel')}
        loading={remove.isPending}
        error={remove.error && errorMessage(remove.error)}
        onConfirm={() => remove.mutate()}
        onClose={() => {
          setRemoving(null);
          remove.reset();
        }}
      />
    </>
  );
}
