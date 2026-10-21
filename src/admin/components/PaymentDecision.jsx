import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, PromptDialog, useToast } from '@/ui';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

/** Approve / Reject buttons for a pending payment. Approving credits the connections. */
export function PaymentDecision({ payment }) {
  const { t } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const done = () => {
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['overview'] });
  };
  const verify = useMutation({
    mutationFn: () => adminApi.verifyPayment(payment.id),
    onSuccess: () => {
      toast.success(`${payment.invoiceNo} ✓`);
      done();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const reject = useMutation({
    mutationFn: (reason) => adminApi.rejectPayment(payment.id, reason),
    onSuccess: () => {
      setRejecting(false);
      done();
    },
  });
  return (
    <span className="flex flex-wrap gap-2">
      <Button size="sm" loading={verify.isPending} onClick={() => verify.mutate()}>
        {t('common.approve')}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setRejecting(true)}>
        {t('common.reject')}
      </Button>
      <PromptDialog
        open={rejecting}
        title={t('payments.rejectTitle')}
        description={`${payment.invoiceNo} · ${payment.trxId ?? ''}`}
        label={t('payments.rejectReason')}
        confirmLabel={t('common.reject')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        loading={reject.isPending}
        error={reject.error && errorMessage(reject.error)}
        onConfirm={(reason) => reject.mutate(reason)}
        onClose={() => setRejecting(false)}
      />
    </span>
  );
}
