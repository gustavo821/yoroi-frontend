// @flow

import type { Node } from 'react';

import { select, boolean, } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import { ServerStatusErrors } from '../../types/serverStatusErrorType';
import TermsOfUsePage from './TermsOfUsePage';
import { withScreenshot } from 'storycap';
import { getTermsOfUse } from '../../stores/base/BaseProfileStore';
import { globalKnobs } from '../../../stories/helpers/StoryWrapper';

export default {
  title: `${__filename.split('.')[0]}`,
  component: TermsOfUsePage,
  decorators: [withScreenshot],
};

export const Generic = (): Node => (
  <TermsOfUsePage
    generated={{
      stores: {
        wallets: {
          selected: null,
        },
        profile: {
          setTermsOfUseAcceptanceRequest: {
            isExecuting: boolean('isExecuting', false),
            error: null,
          },
          termsOfUse: getTermsOfUse('ada', globalKnobs.locale()),
        },
        serverConnectionStore: {
          checkAdaServerStatus: select(
            'checkAdaServerStatus',
            ServerStatusErrors,
            ServerStatusErrors.Healthy,
          ),
        }
      },
      actions: {
        profile: {
          acceptTermsOfUse: { trigger: async (req) => action('acceptTermsOfUse')(req) },
        }
      }
    }}
  />
);

/* ===== Notable variations ===== */
