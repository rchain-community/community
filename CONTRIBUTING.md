# Development and Design notes for Contributors

Thanks for your interest in contributing!

## Quality Code Style

This project uses [```shellcheck```](https://github.com/koalaman/shellcheck) for static analysis of shell scripts. Pull requests that do not pass ```shellcheck``` will require remediation before approval.
Shell script contributors using vscode are encouraged to install the vscode extension https://marketplace.visualstudio.com/items?itemName=timonwong.shellcheck.
```shellcheck``` is also available in the Ubuntu package ```shellcheck```

Pull requests involving javascript are tested using https://eslint.org/.
eslint can be run using:
 1. `npm run lint-check`
 2. `npm run lint:types`

## Object capability (ocap) discipline

In order to support robust composition and cooperation without
vulnerability, code in this project should adhere to [object
capability discipline][ocap].

  - **Memory safety and encapsulation**
    - There is no way to get a reference to an object except by
      creating one or being given one at creation or via a message; no
      casting integers to pointers, for example. _JavaScript is safe
      in this way._

      From outside an object, there is no way to access the internal
      state of the object without the object's consent (where consent
      is expressed by responding to messages). _We use `Object.freeze`
      and closures rather than properties on `this` to achieve this._

  - **Primitive effects only via references**
    - The only way an object can affect the world outside itself is
      via references to other objects. All primitives for interacting
      with the external world are embodied by primitive objects and
      **anything globally accessible is immutable data**. There must be
      no `open(filename)` function in the global namespace, nor may
      such a function be imported. _We use a convention
      of only accessing ambient authority inside WARNING sections._

  - **PyRGOV Testing framework**
    - PyRGOV is in its infancy. It currently does not adhere to ocap
      discipline. Enhancements to the testing framework will be expected
      to remediate this oversight.

[ocap]: http://erights.org/elib/capability/ode/ode-capabilities.html


## To run RNode stand alone on localhost:
for bootstrapping, snapshots, and updating a rgov localhost instance for linux and Window10 WSL2

This localhost environment aims to be a complete usable development system, (once testnet works again). While there are pieces elsewhere and this may not be the final resting place, this is not a docker solution and is specific to the capability directory structure of communities/working groups, their communications and their governance. A future aim would be to make this play well with jakefile and docker shard solutions.

Watch video of how to run an rnode localhost and add rgov actions here https://youtu.be/9TIPXXSXwnE bootstraping updates https://youtu.be/fuXFDRXJsVM

[see below](#localhost-deployment-and-development)

## To deploy the contracts: (out of date)

```
npm install
npx jake
```

## Automated deployment with jake

[Jake](https://jakejs.com/) is a JavaScript build tool for NodeJS, much like `make`.
_Recall that `npx` is a mechanism for launching executables in npm project dependencies,
i.e. in `node_modules/.bin`._

To list the build targets:

```
$ npx jake -t
jake default                    # deploy inbox.rho,directory.rho,Community.rho
jake startShard                 # start local shard with validator, observer
jake rho_modules/inbox.json     # deploy inbox.rho
jake rho_modules/directory.json # deploy directory.rho
jake rho_modules/Community.json # deploy Community.rho -> directory.rho
```

## `startShard` with docker-compose

_KLUDGE: this currently depends on `ln -s ../rnode-client-js docker-shard`
where `../rnode-client-js` is a a clone of that repo. Eventually
the `rchain-community/docker-shard` repo should subsume `rnode-client-js`
for this purpose and we and attach it as a git submodule._

If you get `Error: Could not visualize graph, casper instance was not available yet.`
wait until `MultiParentCasper instance created.` appears in the rnode log
and try again; this code isn't smart enough to do that automatically.

## Contract deployment with registry URI fixups

Note the use of `contractTask('Community.rho', ['directory.rho']);` in `Jakefile.js`
as well as the following idiom in `Community.rho`:

```scala
    match ("import", "./directory.rho", `rho:id:...`) {
    (_, _, directoryURI) => lookup!(directoryURI, *ret)
    }
```

The `contractTask` that deploys `directory.rho` saves the resulting URI
in `rho_modules/directory.json` so that the task for `Community.rho` can
substitute it in for `rho:id:...` above.

```
$ npx jake
Starting 'startShard'...
boot is up-to-date
read is up-to-date
TODO: wait for "MultiParentCasper instance created." in the log
Finished 'startShard' after 408 ms
Starting 'rho_modules'...
Finished 'rho_modules' after 1 ms
Starting 'rho_modules/inbox.json'...
inbox.rho deps: 0
resolve { src: 'inbox.rho' }
resolve { src: 'inbox.rho', depTargets: [] }
{ src: 'inbox.rho', byDep: {} }
inbox.rho deps: 0 { new Inbox, deployId(`r..... } http://127.0.0.1:40413 after:
inbox.rho deps: 0 { new Inbox, deployId(`r..... } http://127.0.0.1:40413 after: 9 sig: 3045022100bc1141bf2bfccf... deploy
inbox.rho deps: 0 { new Inbox, deployId(`r..... } http://127.0.0.1:40413 after: 9 sig: 3045022100bc1141bf2bfccf... deploy @
inbox.rho deps: 0 { new Inbox, deployId(`r..... } http://127.0.0.1:40413 after: 9 sig: 3045022100bc1141bf2bfccf... deploy @ @
inbox.rho deps: 0 { new Inbox, deployId(`r..... } http://127.0.0.1:40413 after: 9 sig: 3045022100bc1141bf2bfccf... deploy @ @ "rho:id:3xagffydedp5qq9y...
Finished 'rho_modules/inbox.json' after 15157 ms
Starting 'rho_modules/directory.json'...
directory.rho deps: 0
resolve { src: 'directory.rho' }
resolve { src: 'directory.rho', depTargets: [] }
{ src: 'directory.rho', byDep: {} }
directory.rho deps: 0 { new deployId(`rho:rchain... } http://127.0.0.1:40413 after:
directory.rho deps: 0 { new deployId(`rho:rchain... } http://127.0.0.1:40413 after: 10 sig: 3044022008d59c2461ba729c... deploy
directory.rho deps: 0 { new deployId(`rho:rchain... } http://127.0.0.1:40413 after: 10 sig: 3044022008d59c2461ba729c... deploy @
directory.rho deps: 0 { new deployId(`rho:rchain... } http://127.0.0.1:40413 after: 10 sig: 3044022008d59c2461ba729c... deploy @ @
directory.rho deps: 0 { new deployId(`rho:rchain... } http://127.0.0.1:40413 after: 10 sig: 3044022008d59c2461ba729c... deploy @ @ "rho:id:yzgukdzqe3bwbdb1...
Finished 'rho_modules/directory.json' after 15120 ms
Starting 'rho_modules/Community.json'...
Community.rho deps: 1
resolve { src: 'Community.rho' }
resolve { src: 'Community.rho', depTargets: [ 'rho_modules/directory.json' ] }
{
  src: 'Community.rho',
  byDep: {
    'directory.rho': 'rho:id:yzgukdzqe3bwbdb11dageiamnp1w83bh7j79kc8nqghg9qie95pt8d'
  }
}
Community.rho deps: 1 { new Community, commMap, ... } http://127.0.0.1:40413 after:
Community.rho deps: 1 { new Community, commMap, ... } http://127.0.0.1:40413 after: 11 sig: 3044022069195ae4be4aad4b... deploy
Community.rho deps: 1 { new Community, commMap, ... } http://127.0.0.1:40413 after: 11 sig: 3044022069195ae4be4aad4b... deploy @
Community.rho deps: 1 { new Community, commMap, ... } http://127.0.0.1:40413 after: 11 sig: 3044022069195ae4be4aad4b... deploy @ @
Community.rho deps: 1 { new Community, commMap, ... } http://127.0.0.1:40413 after: 11 sig: 3044022069195ae4be4aad4b... deploy @ @ "rho:id:r5f1x6zxerhcsp7a...
Finished 'rho_modules/Community.json' after 15155 ms
Starting 'default'...
{ SRCS: [ 'inbox.rho', 'directory.rho', 'Community.rho' ] }
Finished 'default' after 0 ms
```

## localhost deployment and development
To create an rchain node locally, deploy rchain dependencies, and deploy liquid-democracy use the following commands. These commands will:
  1) Create several log files, which can be largely ignored.
  2) clone the rchain repo
  3) deploy the rholang files from rchain and liquid-democracy
  4) Generate javascript, json, and rholang files containing the URI values for contracts that emit a '#define' line - generated files have a filenames that starts with 'generated'
  5) Create a 'snapshot' containing the resulting rnode database that can be restored with restore-snapshot
  6) Place the running rnode log file in 'bootstrap/log/run-rnode.log'

```bash
cd bootstrap
./bootstrap
./deploy-all
./run-rnode
cd ..
```

## web interface installation
```bash
npm install
```

## running web interface
```bash
npm start
```

## snapshots
Restore a snapshot previously created with bootstrap/create-snapshot
```bash
cd bootstrap && restore-snapshot
```

After initial bootstrap and deploy-all, there will be two snapshots available: 'bootstrap' and 'rgov'

List snapshots available for restore
```bash
cd bootstrap && list-snapshot
```

Save a copy of the localhost rnode that can be restored at a later date
```bash
cd bootstrap  && create-snapshot
```

## Command line deployment of rholang
Deploy the rholang file "test.rho"
```bash
cd bootstrap && ./deploy ../test.rho
```
Propose the previously deployed rholang file "test.rho"
```bash
bootstrap/propose
```

## Misc: dependencies
We have a dependency on rchain-toolkit. For utils. This can go away soon, right?
