import { getServerSideConfig } from '@/pages/ChatPage/config/server';
import { OpenaiPath } from '@/pages/ChatPage/constant';
import { prettyObject } from '@/pages/ChatPage/utils/format';
import { auth } from '../../auth';
import { requestOpenai } from '../../common';

const ALLOWD_PATH = new Set(Object.values(OpenaiPath));

function getModels(remoteModelRes: any) {
  const config = getServerSideConfig();

  if (config.disableGPT4) {
    remoteModelRes.data = remoteModelRes.data.filter((m: any) => !m.id.startsWith('gpt-4'));
  }

  return remoteModelRes;
}

async function handle(req: any, { params }: { params: { path: string[] } }) {
  console.log('[OpenAI Route] params ', params);

  if (req.method === 'OPTIONS') {
    // return NextResponse.json({ body: "OK" }, { status: 200 });
    return { body: 'OK' };
  }

  const subpath = params.path.join('/');

  if (!ALLOWD_PATH.has(subpath)) {
    console.log('[OpenAI Route] forbidden path ', subpath);
    return {
      error: true,
      msg: 'you are not allowed to request ' + subpath,
    };
    // return NextResponse.json(
    //   {
    //     error: true,
    //     msg: "you are not allowed to request " + subpath,
    //   },
    //   {
    //     status: 403,
    //   },
    // );
  }

  const authResult = auth();
  if (authResult.error) {
    // return NextResponse.json(authResult, {
    //   status: 401,
    // });
    return authResult;
  }

  try {
    const response: any = await requestOpenai(req);

    // list models
    if (subpath === OpenaiPath.ListModelPath && response.status === 200) {
      const resJson: any = await response.json();
      const availableModels = getModels(resJson);
      // return NextResponse.json(availableModels, {
      //   status: response.status,
      // });
      return availableModels;
    }

    return response;
  } catch (e) {
    console.error('[OpenAI] ', e);
    // return NextResponse.json(prettyObject(e));
    return prettyObject(e);
  }
}

export const GET = handle;
export const POST = handle;

export const runtime = 'edge';
export const preferredRegion = [
  'arn1',
  'bom1',
  'cdg1',
  'cle1',
  'cpt1',
  'dub1',
  'fra1',
  'gru1',
  'hnd1',
  'iad1',
  'icn1',
  'kix1',
  'lhr1',
  'pdx1',
  'sfo1',
  'sin1',
  'syd1',
];
