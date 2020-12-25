// @ts-check
import htm from 'htm';
import m from 'mithril';
import {
  RNode,
  RhoExpr,
  getEthProvider,
  MetaMaskAccount,
  getAddrFromEth,
  signMetaMask,
  startTerm,
  listenAtDeployId,
} from 'rchain-api';
import { actions } from './actions.js';
const { freeze, keys, entries } = Object;

// TODO: UI for phloLimit
const maxFee = { phloPrice: 1, phloLimit: 0.05 * 100000000 };

// TODO: ISSUE: are networks really const? i.e. design-time data?
const NETWORKS = {
  testnet: {
    observerBase: 'https://observer.testnet.rchain.coop',
    // TODO: rotate validators
    validatorBase: 'https://node2.testnet.rchain-dev.tk',
  },
  mainnet: {
    observerBase: 'https://observer.services.mainnet.rchain.coop',
    validatorBase: 'https://node12.root-shard.mainnet.rchain.coop',
  },
};

// rnode.js:63 POST https://observer.services.mainnet.rchain.coop/api/explore-deploy 400 (Bad Request)
// rnode.js:73 Uncaught (in promise) Error: File write failed: No space left on device
const ROLL = `11112fZEixuoKqrGH6BxAPayFD8LWq9KRVFwcLvA5gg6GAaNEZvcKL
11112PaJTzAUqVkfpyjUJpk2XWKS2QMtFfFE5iWq62vGRUaEH1ZcXj
11112UccvordMtYMk3ALmZJRhCrjHsnxh52b2wqcDexQ63xoZAjVZF
11112JXatAMBStxF79MbUyY9AbkiCjHFx2DAjwXvqVpQ3Yk24YQEDC
1111mQx7bW17rJwKeYnUWAB4fN3yA1bTH4U6obRDH7dyv8mGvXSQz
11112PNUTSEf1Gujfj4u415KQLy8S3NTWYW6QxdjDAK5Hj4RbHrMti
11112hh67Rr4BVevdLYy46TKSASeapfCgeWWZpB5v7nf6agCK3tHF4
1111J5bVLwMGNroxr9DCQguJnzWR74o4H6Tb4rakexoHSzZcow47r
1111ye6MaahuvJfzUofP1bA5K5BxXD6Vbo6bi3HfaJnJaFq6mUpxB
1111NLmTJyXbHqALwGJxz73DSXtuzXLoBqg6pzBvEVLWjdzBYaYCG
1111229Y7xRnTRPMqbbXVyzAEVvAA1ikBvZNP3crck2Vji1dNpKbvH
1111Fk3FQgPGCozndA28Kkkpk34Z4hAen8uAfsLhGw5JnXG8TtdZU
111128XWevfc8z89JzxnwqPR9ive6uwBGCeo72p8TKqT8wRoy6ZgLo
11112AQiVPXmASU2SGnS2qCQN5p3QyEcp2mZTYn5KmNwEKEswfuRp2
`
  .trim()
  .split('\n');

/**
 * TODO: expect rather than unwrap (better diagnostics)
 * @param {T?} x
 * @returns {T}
 * @template T
 */
function unwrap(x) {
  if (!x) throw new TypeError('unexpected null / undefined');
  return x;
}

//const optionSelected = (/** @type { boolean } */ bool) =>
//  bool ? { selected: 'selected' } : {};
document.addEventListener('DOMContentLoaded', () => {
  /** @type {(selector: string) => HTMLElement} */
  const $ = (selector) => unwrap(document.querySelector(selector));

  const html = htm.bind(m);

  buildUI({
    html,
    busy: makeBusy($),
    formValue: (selector) => ckControl($(selector)).value,
    fetch,
    setTimeout,
    clock: () => Promise.resolve(Date.now()),
    getEthProvider: () => getEthProvider({ window }),
    mount: (selector, control) => m.mount($(selector), control),
    redraw: () => m.redraw(),
  });
});

/**
 * @typedef {{
 *   formValue: (selector: string) => string,
 *   busy: (selector: string, p: Promise<T>) => Promise<T>,
 * }} FormAccess
 * @template T
 */

/**
 * @param {(selector: string) => HTMLElement} $
 */
function makeBusy($) {
  /**
   * @param {string} selector
   * @param {Promise<T>} p
   * @return {Promise<T>}
   *
   * @template T
   */
  async function busy(selector, p) {
    $('form').style.cursor = 'wait';
    const button = $(selector);
    if (!(button instanceof HTMLButtonElement)) throw TypeError(String(button));
    button.style.cursor = 'wait';
    button.disabled = true;

    try {
      const result = await p;
      return result;
    } finally {
      button.disabled = false;
      $('form').style.cursor = 'inherit';
      button.style.cursor = 'inherit';
      m.redraw();
    }
  }
  return busy;
}

/**
 * @param { HTMLBuilder & EthSignAccess & MithrilMount & WebAccess & FormAccess<any> & ScheduleAccess } io
 * @typedef {import('./actions').FieldSpec} FieldSpec
 *
 * @typedef {{
 *   fetch: typeof fetch
 * }} WebAccess
 *
 *
 * @typedef {{
 *   html: any, // TODO: htm(m) type
 * }} HTMLBuilder
 *
 * @typedef {{
 *   mount: (selector: string, component: import('mithril').Component) => void,
 *   redraw: () => void,
 * }} MithrilMount
 * @typedef {{
 *   getEthProvider: () => Promise<MetaMaskProvider>
 * }} EthSignAccess
 *
 * @typedef {{
 *   clock: () => Promise<number>,
 *   setTimeout: typeof setTimeout,
 * }} ScheduleAccess
 *
 * @typedef { import('rchain-api/src/ethProvider').MetaMaskProvider } MetaMaskProvider
 */
function buildUI({
  html,
  formValue,
  busy,
  clock,
  setTimeout,
  getEthProvider,
  mount,
  redraw,
  fetch,
}) {
  const rnode = RNode(fetch);
  let action = 'helloWorld';
  let network = 'testnet';
  /** @type {{ observer: Observer, validator: Validator}} shard */
  let shard;
  let term = ''; //@@DEBUG
  /** @type {Record<string, string>} */
  let fieldValues = {};
  /** @type {RhoExpr[]} */
  let results = [];
  const bindings = { mainnet: {}, testnet: { $roll: ROLL } };

  const state = {
    get shard() {
      return shard;
    },
    get network() {
      return network;
    },
    set network(value) {
      const net = NETWORKS[value];
      if (!net) return;
      network = value;
      console.log({ network, net });
      shard = {
        observer: rnode.observer(net.observerBase),
        validator: rnode.validator(net.validatorBase),
      };
      state.bindings = bindings[network];
    },
    get action() {
      return action;
    },
    set action(value) {
      if (typeof value !== 'string') return;
      action = value;
      const fields = actions[action].fields || {};
      const init = Object.fromEntries(
        entries(fields).map(([name, { value }]) => [name, value || '']),
      );
      state.fields = init;
    },
    get fields() {
      return fieldValues;
    },
    set fields(/** @type {Record<String, string>} */ value) {
      const { fields, template } = actions[state.action];
      if (fields) {
        fieldValues = Object.fromEntries(
          keys(fields).map((k) => [k, value[k]]),
        );
        const exprs = entries(fieldValues).map(([name, value]) =>
          fields[name].type === 'uri' ? `\`${value}\`` : JSON.stringify(value),
        );
        state.term = `match [${exprs.join(', ')}] {
          [${keys(fieldValues).join(', ')}] => {
            ${template}
          }
        }`;
      } else {
        fieldValues = {};
        state.term = template;
      }
    },
    get term() {
      return term;
    },
    set term(value) {
      term = value;
      state.results = [];
      state.problem = undefined;
    },
    bindings: bindings[network],
    get results() {
      return results;
    },
    set results(/** @type {RhoExpr[]} */ value) {
      results = value;
      results.forEach((expr) => {
        const decl = RhoExpr.parse(expr);
        if (Array.isArray(decl)) {
          const [kw, name, rhs] = decl;
          if (kw !== '#define') return;
          if (typeof name !== 'string') return;
          state.bindings[name] = rhs;
        }
      });
    },
    problem: undefined,
  };
  state.action = action; // compute initial term
  state.network = 'testnet'; // initialize shard

  mount('#actionControl', actionControl(state, { html, getEthProvider }));

  mount('#netControl', networkControl(state, { html }));
  mount('#runControl',
    runControl(state, {
      html,
      formValue,
      busy,
      clock,
      getEthProvider,
      setTimeout,
    }),
  );
  mount('#groupControl', groupControl(state, { html }));
}

/**
 * @param {unknown} ctrl
 * @returns {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement}
 */
function ckControl(ctrl) {
  if (
    !(ctrl instanceof HTMLInputElement) &&
    !(ctrl instanceof HTMLSelectElement) &&
    !(ctrl instanceof HTMLTextAreaElement)
  )
    throw TypeError(String(ctrl));
  return ctrl;
}

/**
 * @param {{
 *   action: string,
 *   fields: Record<string, string>,
 *   term: string,
 * }} state
 * @param {HTMLBuilder & EthSignAccess} io
 */
function actionControl(state, { html, getEthProvider }) {
  const options = (/** @type {string[]}*/ ids) =>
    ids.map(
      (id) =>
        html`<option value=${id} ...${{ selected: id === state.action }}>
          ${id}
        </option>`,
    );

  const metaMaskP = getEthProvider().then((ethereum) =>
    MetaMaskAccount(ethereum),
  );

  const fty = (action, name) => {
    const f = actions[action].fields;
    if (!f) return 'string';
    return f[name].type;
  };
  const connectButton = (name) => html`<button
    onclick=${(/** @type {Event} */ event) => {
      metaMaskP.then((mm) =>
        mm.ethereumAddress().then((ethAddr) => {
          const revAddr = getAddrFromEth(ethAddr);
          if (!revAddr) throw new Error('bad ethAddr???');
          const current = { [name]: revAddr };
          const old = state.fields;
          state.fields = { ...old, ...current };
          m.redraw(); // FIXME ambient?
        }),
      );
      return false;
    }}
    >
    Connect Wallet
    </button>`;
  const fieldControls = (
    /** @type {string} */ action,
    /** @type {Record<string, string>} */ fields,
  ) => {
    const fragment = entries(fields).map(
      ([name, value]) =>
        html`<div id=${`${action}.${name}`}>
        <label
            >${name}:
            <input
              name=${name}
              value=${value}
              onchange=${(/** @type {Event} */ event) => {
            const current = { [name]: ckControl(event.target).value };
            const old = state.fields;
            state.fields = { ...old, ...current };
            return false;
          }}
          /></label>
          ${fty(action, name) === 'walletRevAddr' ? connectButton(name) : ''}
          </div>`,
    );
    return fragment;
  };

  return freeze({
    view() {
      return html`
        <label
          >Action:
          <select
            name="action"
            onchange=${(/** @type {Event} */ event) => {
          state.action = ckControl(event.target).value;
          return false;
        }}
          >
            ${options(keys(actions))}
          </select>
        </label>
        <div class="fields">${fieldControls(state.action, state.fields)}</div>
        <textarea
          cols="80"
          rows="16"
          onchange=${(event) => {
          console.log('@@term textarea before', { term: state.term });
          state.term = ckControl(event.target).value;
          console.log('@@term textarea after', { term: state.term });
        }}
        >
        ${state.term}</textarea
        >
      `;
    },
  });
}

/**
 * @param {{
 *   shard: { observer: Observer, validator: Validator },
 *   term: string,
 *   results: RhoExpr[],
 *   problem?: string,
 * }} state
 * @param {HTMLBuilder & FormAccess<any> & EthSignAccess & ScheduleAccess} io
 *
 * @typedef {import('rchain-api').RhoExpr} RhoExpr
 * @typedef {import('rchain-api').Observer} Observer
 * @typedef {import('rchain-api').Validator} Validator
 * @typedef {import('rchain-api').DeployData} DeployData
 */
function runControl(
  state,
  { html, busy, getEthProvider, clock },
  period = 5 * 1000,
) {
  const hide = (/** @type { boolean } */ flag) =>
    flag ? { style: 'display: none' } : {};

  const pprint = (obj) => JSON.stringify(obj, null, 2);

  async function explore(/** @type {string} */ term) {
    const obs = state.shard.observer;
    state.problem = undefined;
    state.results = [];
    try {
      console.log('explore...');
      const { expr, block } = await busy(
        '#explore',
        obs.exploratoryDeploy(term),
      );
      console.log('... explore done.');
      state.results = expr;
      // TODO? $('#blockInfo').textContent = pprint(block);
    } catch (err) {
      state.problem = err.message;
    }
  }

  async function deploy(/** @type {string} */ term) {
    const obs = state.shard.observer;
    const val = state.shard.validator;
    state.problem = undefined;
    state.results = [];

    const account = freeze({
      polling: () =>
        // TODO: UI to cancel
        new Promise((resolve) => {
          setTimeout(resolve, period);
        }),
      async sign(/** @type { string } */ term) {
        const [timestamp, [recent]] = await Promise.all([
          clock(),
          obs.getBlocks(1),
        ]);
        const ethereum = await getEthProvider();
        return signMetaMask(
          {
            term,
            ...maxFee,
            timestamp,
            validAfterBlockNumber: recent.blockNumber,
          },
          ethereum,
        );
      },
    });

    try {
      await busy(
        '#deploy',
        (async () => {
          const deploy = await startTerm(term, val, obs, account);
          console.log('@@DEBUG', state.action, { deploy });
          const { expr } = await listenAtDeployId(obs, deploy);
          console.log('@@DEBUG', state.action, { expr });
          state.results = [expr];
        })(),
      );
      // TODO? $('#blockInfo').textContent = pprint(block);
    } catch (err) {
      state.problem = err.message;
    }
  }

  return freeze({
    view() {
      return html`<button
          id="explore"
          onclick=${async (/** @type {Event} */ event) => {
          event.preventDefault();
          explore(state.term);
        }}
        >
          Explore
        </button>
        <button
          id="deploy"
          onclick=${async (/** @type {Event} */ event) => {
          event.preventDefault();
          deploy(state.term);
        }}
        >
          Deploy
        </button>
        <section id="resultSection" ...${hide(!state.results)}>
          <h2>Result</h2>
          <pre id="result">
${state.results ? pprint(state.results.map(RhoExpr.parse)) : ''}</pre
          >
          <!-- TODO
          <h2>Block Info</h2>
          <small>
            <pre id="blockInfo"></pre>
          </small>
          -->
        </section>
        <section id="problemSection" ...${hide(!state.problem)}>
          <h3>Problem</h3>
          <pre id="problem">${state.problem ? state.problem : ''}</pre>
        </section>`;
    },
  });
}

/**
 * @param {Observer} observer
 * @param {string} uri
 */
async function lookupSet(observer, uri) {
  const term = `
    new ret, ch, lookup(\`rho:registry:lookup\`) in {
      lookup!(\`${uri}\`, *ch) |
      for (@set <- ch) { ret!(set.toList())}
    }`;
  console.log('lookupSet', { uri });
  const {
    expr: [items],
  } = await observer.exploratoryDeploy(term);
  console.log('lookupSet done.');
  return RhoExpr.parse(items);
}

function networkControl(state, { html }) {
  return freeze({
    view() {
      return html`<div id="netControl">
        <select
          onchange=${(event) => (state.network = ckControl(event.target).value)}
        >
          <option name="network" value="mainnet">mainnet</option>
          <option name="network" value="testnet" selected>testnet</option>
        </select>
      </div>`;
    },
  });
}

/**
 * @param {{ action: string, fields: Record<string, string>, bindings: Record<string, unknown> }} state
 * @param {HTMLBuilder} io
 * @typedef { string } RevAddress
 */
function groupControl(state, { html }) {
  const score = (/** @type { string } */ revAddr) => {
    const kudos = state.bindings['$kudos'];
    if (typeof kudos !== 'object' || !kudos) return 0;
    const score = kudos[revAddr];
    if (typeof score !== 'number') return 0;
    return score;
  };
  const nick = (/** @type { string } */ revAddr) => revAddr.slice(5, 15);
  const avatar = (/** @type { string } */ revAddr) =>
    `https://robohash.org/${revAddr}?size=64x64;set=set3`;

  return freeze({
    view() {
      const roll = state.bindings['$roll'];
      if (!Array.isArray(roll)) return;
      return html` <h3>Members</h3>
        <div>
          ${roll.map(
        (revAddr) =>
          html`
                <div
                  id="${revAddr}"
                  data-revAddr=${revAddr}
                  class="card avatar"
                >
                  <img valign="middle" src=${avatar(revAddr)} />
                  <button
                    class="like"
                    onclick=${() => {
              state.action = 'awardKudos';
              state.fields = { ...state.fields, them: revAddr };
            }}
                  >
                    ❤️
                  </button>
                  <sup class="likes">${score(revAddr) || ''}</sup><br />
                  <strong class="name">${nick(revAddr)}</strong>
                </div>
              `,
      )}
        </div>`;
    },
  });
}
