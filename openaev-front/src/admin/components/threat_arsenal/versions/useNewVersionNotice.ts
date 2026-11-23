import { useEffect, useState } from 'react';

import { type ThreatArsenalAction } from '../../../../utils/api-types';
import { olderVersionsInUse } from './usages/usageCounts';
import useUsageCounts from './usages/useUsageCounts';
import useUsagesByVersion from './usages/useUsagesByVersion';
import usePayloadVersions from './usePayloadVersions';
import useSkipNewVersionDialog from './useSkipNewVersionDialog';

/**
 * After a save that added a version: offers to move the injects left on older ones. The new card
 * replaces this one once that is done, as this card's menu hosts the dialog.
 */
const useNewVersionNotice = (actionId: string, onUpdate?: (action: ThreatArsenalAction, replacedId?: string) => void) => {
  const [saved, setSaved] = useState<ThreatArsenalAction | null>(null);
  const [skipsDialog] = useSkipNewVersionDialog();
  const versions = usePayloadVersions(saved?.injector_contract_id ?? '', !!saved);
  const counts = useUsageCounts(saved?.injector_contract_id);
  const older = versions && counts && saved ? olderVersionsInUse(versions, counts, saved.injector_contract_id) : [];
  // Only the versions to move from load their usages, for the dialog to pick them.
  const usages = useUsagesByVersion(older);

  const loaded = !!versions && !!counts;
  const olderVersions = older.every(version => usages[version.payload_id])
    ? older.map(version => ({
        version,
        usages: usages[version.payload_id],
      }))
    : [];

  const replaceCard = (action: ThreatArsenalAction) => {
    onUpdate?.(action, actionId);
    setSaved(null);
  };

  useEffect(() => {
    if (saved && loaded && older.length === 0) replaceCard(saved);
  }, [saved, loaded, older.length]);

  const afterSave = (action: ThreatArsenalAction) => {
    if (action.injector_contract_id === actionId || skipsDialog) {
      onUpdate?.(action, actionId);
      return;
    }
    setSaved(action);
  };

  return {
    notice: saved && olderVersions.length > 0
      ? {
          action: saved,
          olderVersions,
        }
      : null,
    afterSave,
    closeNotice: () => {
      if (saved) replaceCard(saved);
    },
  };
};

export default useNewVersionNotice;
