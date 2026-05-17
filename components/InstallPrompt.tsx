'use client';

import type { Platform } from '@/lib/hooks/useInstallPrompt';

interface InstallPromptProps {
  canInstall: boolean;
  isInstalled: boolean;
  platform: Platform;
  promptInstall: () => Promise<void>;
  showIOSGuide: boolean;
  dismissIOSGuide: () => void;
}

export function InstallPrompt({
  canInstall,
  isInstalled,
  platform,
  promptInstall,
  showIOSGuide,
  dismissIOSGuide,
}: InstallPromptProps) {
  if (isInstalled || !canInstall) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-3 z-40">
        <span className="text-2xl shrink-0">🌿</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">앱으로 설치하기</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">홈 화면에서 바로 실행</p>
        </div>
        <button
          onClick={promptInstall}
          className="text-sm font-semibold text-green-500 hover:text-green-600 shrink-0"
        >
          {platform === 'ios' ? '홈 화면에 추가' : '앱으로 설치'}
        </button>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              홈 화면에 추가하는 방법
            </h2>
            <ol className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex gap-3">
                <span className="font-bold text-green-500 shrink-0">1</span>
                <span>Safari 하단의 <strong>공유</strong> 버튼(□↑)을 탭하세요</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-green-500 shrink-0">2</span>
                <span>스크롤해서 <strong>홈 화면에 추가</strong>를 탭하세요</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-green-500 shrink-0">3</span>
                <span>오른쪽 위의 <strong>추가</strong>를 탭하세요</span>
              </li>
            </ol>
            <button
              aria-label="확인"
              onClick={dismissIOSGuide}
              className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl py-3 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
