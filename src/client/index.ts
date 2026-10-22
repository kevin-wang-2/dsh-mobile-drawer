import { applyViewport } from './viewport';
import { applyDrawer } from './drawer';
import { applyKeys } from './keys';
import { CSS } from './style';
import { applySettings, SETTINGS_CSS } from './settings';
import type { ILayout } from '@deepseek-ai/dsh-client-ui-layout/client';
import type { KeysContext } from './keys';

export interface MobileContext extends KeysContext {
  layout: Pick<ILayout, 'toggleSidebar'>;
}

export const name = 'dsh-mobile-drawer';
export const inject = ['layout', 'slots'];

export function apply(ctx: MobileContext): void {
  const host = window as typeof window & { __dshMobileDrawerDispose?: () => void };
  // 同一插件热重载时，先清理旧的 DOM 和监听器。
  host.__dshMobileDrawerDispose?.();
  const cleanups: Array<() => void> = [];
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const cleanup of cleanups.reverse()) cleanup?.();
    if (host.__dshMobileDrawerDispose === dispose) delete host.__dshMobileDrawerDispose;
  };
  host.__dshMobileDrawerDispose = dispose;
  const scoped: MobileContext = { layout: ctx.layout, slots: {
    inject: (key, callback) => ctx.slots.inject(key, callback),
    register: (...args: Parameters<KeysContext['slots']['register']>) => {
      const unregister = ctx.slots.register(...args);
      cleanups.push(unregister);
      return unregister;
    },
  },
    effect: (effect) => { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); } };
  scoped.effect(() => {
    const style = document.createElement('style');
    style.id = 'dsh-mobile-style';
    style.dataset.plugin = name;
    style.dataset.pluginCss = name + '/mobile.css';
    style.textContent = CSS + SETTINGS_CSS;
    document.head.append(style);
    return () => style.remove();
  });
  const media = matchMedia('(max-width: 1023.98px)');
  applyViewport(scoped, media);
  applyDrawer(scoped, media);
  applyKeys(scoped);
  applySettings(scoped);
  ctx.effect(() => dispose, 'DSH 手机布局、抽屉与输入');
}
