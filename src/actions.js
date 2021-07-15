// @ts-check

/**
 * @typedef {{ filename?: string, fields?: Record<string, FieldSpec> }} ActionSpec
 * @typedef {{ type: 'MasterURI' | 'number' | 'string' | 'set' | 'uri' | 'walletRevAddr' | 'MasterURI', value?: string }} FieldSpec
 * @type {Record<string, ActionSpec>}
 */
export const actions = {
  _select_an_action_: {
    fields: {},
  },
  checkBalance: {
    fields: {
      myGovRevAddr: { type: 'walletRevAddr' },
    },
    filename: 'actions/checkBalance.rho',
  },
  transfer: {
    fields: {
      revAddrFrom: { value: '', type: 'walletRevAddr' },
      revAddrTo: { value: '', type: 'string' },
      amount: { value: '100000000', type: 'number' },
    },
    filename: 'actions/transfer.rho',
  },
  _____________________________: {
    fields: {},
  },
  newInbox: {
    fields: {
      ReadcapURI: { value: '', type: 'MasterURI' },
    },
    filename: 'actions/newinbox.rho',
  },
  peekInbox: {
    fields: {
      lockerTag: { value: 'inbox', type: 'string' },
      type: { value: '', type: 'string' },
      subtype: { value: '', type: 'string' },
    },
    filename: 'actions/peekInbox.rho',
  },
  receiveFromInbox: {
    fields: {
      lockerTag: { value: 'inbox', type: 'string' },
      type: { value: '', type: 'string' },
      subtype: { value: '', type: 'string' },
    },
    filename: 'actions/receiveFromInbox.rho',
  },
  ______________________________: {
    fields: {},
  },
  newBallot: {
    fields: {
      lockerTag: { value: 'inbox', type: 'string' },
      name: { type: 'string', value: '' },
      // choice, choice, choice, ...
      ballot: {
        type: "number",
        value: '',
      },
    },
    filename: 'actions/newBallot.rho',
  },
  castBallot: {
    fields: {
      lockerTag: { value: 'inbox', type: 'string' },
      ballot: { value: '', type: 'string' },
      choices: { value: '', type: 'number' },
    },
    filename: 'actions/castBallot.rho',
  },
  _________________________: {
    fields: {},
  },
  newIssue: {
    fields: {
      lockerTag: { value: 'inbox', type: 'string' },
      name: { type: 'string', value: '' },
      // choice, choice, choice, ...
      proposals: {
        type: 'set',
        value: '',
      },
    },
    filename: 'actions/newIssue.rho',
  },
  addVoterToIssue: {
    fields: {
      lockerTag: { value: 'inbox', type: 'string' },
      toInboxURI: { value: '', type: 'uri' },
      issue: { value: '', type: 'string' },
    },
    filename: 'actions/addVoterToIssue.rho',
  },
  addGroupToIssue: {
    fields: {
      lockerTag: { value: 'inbox', type: 'string' },
      group: { value: '', type: 'string' },
      issue: { value: '', type: 'string' },
    },
    filename: 'actions/addGroupToIssue.rho',
  },
  castVote: {
    fields: {
      lockerTag: { value: 'inbox', type: 'string' },
      issue: { value: '', type: 'string' },
      theVote: { value: '', type: 'string' },
    },
    filename: 'actions/castVote.rho',
  },
  displayVote: {
    fields: {
      lockerTag: { value: 'inbox', type: 'string' },
      issue: { value: '', type: 'string' },
    },
    filename: 'actions/displayVote.rho',
  },
  delegateVote: {
    fields: {
      lockerTag: { value: 'inbox', type: 'string' },
      issue: { value: '', type: 'string' },
      delegateURI: { value: '', type: 'uri' },
    },
    filename: 'actions/delegateVote.rho',
  },
  tallyVotes: {
    fields: {
      lockerTag: { value: 'inbox', type: 'string' },
      issue: { value: '', type: 'string' },
    },
    filename: 'actions/tallyVotes.rho',
  },
  ____________________________: {
    fields: {},
  },
  share: {
    fields: {
      lockerTag: { value: 'inbox', type: 'string' },
      toInboxURI: { value: '', type: 'uri' },
      type: { value: '', type: 'string' },
      subtype: { value: '', type: 'string' },
    },
    filename: 'actions/share.rho',
  },
  sendMail: {
    fields: {
      lockerTag: { value: 'inbox', type: 'string' },
      toInboxURI: { value: '', type: 'uri' },
      from: { value: '', type: 'string' },
      to: { value: '', type: 'string' },
      sub: { value: '', type: 'string' },
      body: { value: '', type: 'string' },
    },
    filename: 'actions/sendMail.rho',
  },
  __________________________: {
    fields: {},
  },
  newGroup: {
    fields: {
      name: { value: '', type: 'string' },
      lockerTag: { value: 'inbox', type: 'string' },
    },
    filename: 'actions/newGroup.rho',
  },
  joinGroup: {
    fields: {
      group: { value: '', type: 'string' },
      userid: { value: '', type: 'string' },
      lockerTag: { value: 'inbox', type: 'string' },
    },
    filename: 'actions/joinGroup.rho',
  },
  addMember: {
    fields: {
      name: { type: 'string', value: '?' },
      revAddress: { type: 'string', value: '' },
      themBoxReg: { type: 'uri', value: '' },
      group: { type: 'string', value: '' },
      lockerTag: { value: 'inbox', type: 'string' },
    },
    filename: 'actions/addMember.rho',
  },
  ___________________________: {
    fields: {},
  },
  newMemberDirectory: {
    fields: {},
    filename: 'actions/newMemberDirectory.rho',
  },

  makeMint: {
    fields: {
      name: { value: 'myTokenMint', type: 'string' },
      lockerTag: { value: 'inbox', type: 'string' },
    },
    filename: 'actions/makeMint.rho',
  },
  helloWorld: {
    fields: {},
    filename: 'actions/helloWorld.rho',
  },
  getRoll: {
    fields: {},
    filename: 'actions/getRoll.rho',
  },
  peekKudos: {
    fields: {},
    filename: 'actions/peekKudos.rho',
  },
  awardKudos: {
    fields: {
      them: { type: 'string', value: '' },
    },
    filename: 'actions/awardKudos.rho',
  },
  claimWithInbox: {
    fields: {
      myGovRevAddr: { type: 'walletRevAddr' },
    },
    filename: 'actions/claimWithInbox.rho',
  },
  checkRegistration: {
    fields: {
      myGovRevAddr: { type: 'walletRevAddr' },
    },
    filename: 'actions/checkRegistration.rho',
  },
  lookupURI: {
    fields: { URI: { value: '', type: 'uri' } },
    filename: 'actions/lookupURI.rho',
  },
  createURI: {
    fields: { value: { value: '', type: 'number' } },
    filename: 'actions/createURI.rho',
  },
  doit: {
    fields: {
      lockerTag: { value: 'inbox', type: 'string' },
      type: { value: 'Group', type: 'string' },
      subtype: { value: '', type: 'string' },
      capability: { value: 'admin', type: 'string' },
      method: { value: 'register', type: 'string' },
      arg: { value: '', type: 'set' },
    },
    filename: 'actions/doit.rho',
  },
  towers: {
    fields: { height: { value: '3', type: 'number' } },
    filename: 'actions/towers.rho',
  },
  
};
