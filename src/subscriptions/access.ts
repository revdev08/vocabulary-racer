export type AccessInfo = { entitlements: { active: Record<string, { isActive: boolean }> } };

export function hasPlus(info: AccessInfo | null): boolean {
  return info?.entitlements.active.plus?.isActive === true;
}

// A purchase dialog result is not proof of access. Always re-read CustomerInfo.
export function createAccessRequest(deps: {
  read: () => Promise<AccessInfo>;
  present: () => Promise<void>;
}) {
  let pending: Promise<boolean> | null = null;
  return () => {
    if (!pending) {
      pending = (async () => {
        if (hasPlus(await deps.read())) return true;
        await deps.present();
        return hasPlus(await deps.read());
      })().finally(() => { pending = null; });
    }
    return pending;
  };
}
