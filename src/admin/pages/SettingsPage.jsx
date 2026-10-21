import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PAYMENT_METHODS } from '@/shared';
import {
  Button,
  Card,
  FormMessage,
  LoadingBlock,
  SelectInput,
  Switch,
  Tabs,
  TextInput,
  useToast,
} from '@/ui';
import { PageHeader } from '../components/PageHeader.jsx';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { useQueryParam } from '../hooks/useQueryParam.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const TABS = ['site', 'payments', 'stats'];
const SOCIAL = ['facebook', 'youtube', 'instagram', 'whatsapp'];
const ACCOUNT_TYPES = ['personal', 'merchant', 'agent'];
const TUTORIALS = ['createBiodata', 'buyConnections', 'viewContact'];
// Methods paid by hand with "Send Money"; gateway-only methods (SSLCommerz) have no number.
const MANUAL_METHODS = PAYMENT_METHODS.filter((m) => !m.gatewayOnly);

/** Returns a copy of `obj` with the value at `path` (e.g. ['bkash', 'enabled']) replaced. */
function setIn(obj, [key, ...rest], value) {
  return { ...obj, [key]: rest.length ? setIn(obj[key] ?? {}, rest, value) : value };
}

function SwitchRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[15px] font-semibold">{label}</span>
      <Switch label={label} checked={!!checked} onChange={onChange} />
    </div>
  );
}

/** One settings group: edits a copy and saves it as a whole. */
function SettingsForm({ settingKey, initial }) {
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(initial);
  const field = (...path) => ({
    value: path.reduce((v, k) => v?.[k], value) ?? '',
    onChange: (e) =>
      setValue((v) => setIn(v, path, e.target.type === 'number' ? Number(e.target.value) : e.target.value)),
  });
  const toggle = (...path) => ({
    checked: path.reduce((v, k) => v?.[k], value),
    onChange: (on) => setValue((v) => setIn(v, path, on)),
  });
  const save = useMutation({
    mutationFn: () => adminApi.updateSettings(settingKey, value),
    onSuccess: (res) => {
      queryClient.setQueryData(
        ['settings'],
        (prev) => prev && { settings: { ...prev.settings, [settingKey]: res.value } },
      );
      toast.success(t('common.saved'));
    },
  });

  let body;
  if (settingKey === 'site') {
    body = (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextInput label={t('settings.siteName')} {...field('name')} />
        <TextInput label={t('settings.supportEmail')} type="email" {...field('supportEmail')} />
        <TextInput label={t('settings.taglineEn')} {...field('tagline', 'en')} />
        <TextInput label={t('settings.taglineBn')} {...field('tagline', 'bn')} />
        <TextInput label={t('settings.supportPhone')} type="tel" {...field('supportPhone')} />
        <TextInput label={t('settings.address')} {...field('address')} />
        {SOCIAL.map((k) => (
          <TextInput key={k} label={t(`settings.${k}`)} {...field(k)} />
        ))}
        <TextInput
          label={t('settings.appUrl')}
          type="url"
          placeholder="https://play.google.com/…"
          {...field('appUrl')}
        />
        <fieldset className="flex flex-col gap-4 rounded-3xl border border-line p-5 sm:col-span-2">
          <legend className="px-2 text-[13px] font-bold text-muted">{t('settings.tutorials')}</legend>
          {TUTORIALS.map((k) => (
            <TextInput
              key={k}
              label={t(`settings.tutorial.${k}`)}
              type="url"
              placeholder="https://youtu.be/…"
              {...field('tutorials', k)}
            />
          ))}
        </fieldset>
      </div>
    );
  } else if (settingKey === 'payments') {
    body = (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextInput
            label={t('settings.verificationHours')}
            type="number"
            min={1}
            max={72}
            {...field('verificationHours')}
          />
          <TextInput
            label={t('settings.approvalGift')}
            hint={t('settings.approvalGiftHint')}
            type="number"
            min={0}
            max={20}
            {...field('approvalGift')}
          />
          <TextInput
            label={t('settings.approvedDiscount')}
            hint={t('settings.approvedDiscountHint')}
            type="number"
            min={0}
            max={90}
            {...field('approvedDiscountPercent')}
          />
        </div>
        {MANUAL_METHODS.map((m) => (
          <fieldset key={m.value} className="flex flex-col gap-4 rounded-3xl border border-line p-5">
            <SwitchRow
              label={t('settings.methodEnabled', { method: m[lang] })}
              {...toggle(m.value, 'enabled')}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput
                label={t('settings.manualNumber', { method: m[lang] })}
                type="tel"
                placeholder="01XXXXXXXXX"
                {...field(m.value, 'manualNumber')}
              />
              <SelectInput
                label={t('settings.accountType')}
                {...field(m.value, 'accountType')}
                options={ACCOUNT_TYPES.map((a) => ({ value: a, label: t(`settings.accountTypes.${a}`) }))}
              />
            </div>
          </fieldset>
        ))}
        <FormMessage tone="info">{t('settings.gatewayNote')}</FormMessage>
      </>
    );
  } else {
    body = (
      <>
        <SwitchRow label={t('settings.showStats')} {...toggle('show')} />
        <TextInput
          label={t('settings.marriagesOffset')}
          type="number"
          min={0}
          className="max-w-xs"
          {...field('marriagesOffset')}
        />
      </>
    );
  }

  return (
    <Card
      as="form"
      title={t(`settings.tabs.${settingKey}`)}
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <FormMessage>{save.error && errorMessage(save.error)}</FormMessage>
      {body}
      <Button type="submit" className="self-end" loading={save.isPending}>
        {t('common.save')}
      </Button>
    </Card>
  );
}

export function SettingsPage() {
  const { t } = useT();
  const [tab, setTab] = useQueryParam('tab', 'site');
  const query = useQuery({ queryKey: ['settings'], queryFn: adminApi.settings });
  const key = TABS.includes(tab) ? tab : 'site';

  return (
    <>
      <PageHeader title={t('settings.title')} sub={t('settings.sub')} />
      <Tabs
        value={key}
        onChange={setTab}
        items={TABS.map((v) => ({ value: v, label: t(`settings.tabs.${v}`) }))}
      />
      {query.isLoading || !query.data ? (
        <LoadingBlock label={t('common.loading')} />
      ) : (
        <SettingsForm key={key} settingKey={key} initial={query.data.settings[key]} />
      )}
    </>
  );
}
