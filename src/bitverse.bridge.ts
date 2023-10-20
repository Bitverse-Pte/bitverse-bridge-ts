declare var bitversewallet: any;

function flutterReady() {
  return (
    (window as any).flutter_inappwebview &&
    typeof (window as any).flutter_inappwebview.callHandler === 'function'
  );
}

// 初始化完成
function initFinish() {
  window.dispatchEvent(new Event('bitverseReady', {}));
  window.dispatchEvent(new Event('ethereum#initialized', {}));
  console.log(`bitverse init success.`);
}

function createError(res): Error {
  const e: any = new Error();
  e.code = res.code;
  e.message = res.message;
  e.payload = res.payload;
  return e;
}

async function initBitverse() {
  const supportMethods = [
    'getSystemInfo',
    'getUserInfo',
    'navigateTo',
    'share',
    'request',
    'getWallets',
    'selectedWallet',
  ];
  (window as any).bitverse = {};

  supportMethods.forEach((method) => {
    (window as any).bitverse[method] = async function (...args) {
      const result = await (window as any).flutter_inappwebview.callHandler(
        'BitverseBridge',
        {
          method,
          arguments: args,
        }
      );
      if (result.code === '0000') {
        return result.payload;
      }
      throw createError(result);
    };
  });
}

async function handleUpdateWeb3Config() {
  const result = await (window as any).flutter_inappwebview?.callHandler(
    'handlerWeb3Request',
    {
      name: 'getConfig',
    }
  );
  if (result.code === '0000') {
    (window as any).ethereum.setConfig(result.payload);
  }
}

async function handleWeb3PostMessage(args) {
  const { id } = args;
  const result = await (window as any).flutter_inappwebview.callHandler(
    'handlerWeb3Request',
    args
  );
  if (result.code === '0000') {
    (window as any).ethereum.sendResponse(id, result.payload);
  } else {
    const e: any = createError(result);
    (window as any).ethereum.sendError(id, e);
  }
}

function handleWeb3PostMessageWithReady(args) {
  return new Promise<void>(async (resolve) => {
    if (flutterReady()) {
      await handleWeb3PostMessage(args);
      resolve();
    } else {
      window.addEventListener('flutterInAppWebViewPlatformReady', async () => {
        await handleWeb3PostMessage(args);
        resolve();
      });
    }
  });
}

function initBitverseWeb3() {
  return new Promise(async (resolve) => {
    const ethereum = new bitversewallet.Provider({});
    (window as any).ethereum = ethereum;
    (window as any).web3 = new bitversewallet.Web3(ethereum);
    bitversewallet.postMessage = handleWeb3PostMessageWithReady;

    if (flutterReady()) {
      await handleUpdateWeb3Config();
      resolve(1);
    } else {
      /**
       * 处理webview ready 事件，并转换为内部事件
       */
      window.addEventListener(
        'flutterInAppWebViewPlatformReady',
        async function () {
          await handleUpdateWeb3Config();
          resolve(1);
        }
      );
    }
  });
}

console.log(`
   ___      _      _                                             
  | _ )    (_)    | |_    __ __    ___      _ _    ___     ___   
  | _ \\    | |    |  _|   \\ V /   / -_)    | '_|  (_-<    / -_)  
  |___/   _|_|_   _\\__|   _\\_/_   \\___|   _|_|_   /__/_   \\___|  
_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""| 
"\`-0-0-'"\`-0-0-'"\`-0-0-'"\`-0-0-'"\`-0-0-'"\`-0-0-'"\`-0-0-'"\`-0-0-' 
`);

(function () {
  Promise.all([initBitverse(), initBitverseWeb3()])
    .then(initFinish)
    .catch((e) => {
      console.error(`bitverse init error:`, e);
    });
})();
