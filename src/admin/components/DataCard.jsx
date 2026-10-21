import { Card, EmptyState, LoadingBlock, Pagination } from '@/ui';
import { useT } from '../providers/PreferencesProvider.jsx';

/**
 * A card holding a paginated list from the API: shows loading, empty and the
 * rendered rows, with pagination underneath.
 */
export function DataCard({ title, action, query, page, onPage, empty, children }) {
  const { t } = useT();
  const data = query.data;
  return (
    <Card title={title} action={action}>
      {query.isLoading || !data ? (
        <LoadingBlock label={t('common.loading')} />
      ) : data.items.length === 0 ? (
        <EmptyState>{empty ?? t('common.empty')}</EmptyState>
      ) : (
        <>
          {children(data.items)}
          {onPage && (
            <Pagination
              page={page}
              pages={data.pages}
              onPage={onPage}
              labels={{ previous: t('common.previous'), next: t('common.next') }}
            />
          )}
        </>
      )}
    </Card>
  );
}
