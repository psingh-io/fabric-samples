/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 */

/*
 *
 * addMarbles.js will add random sample data to blockchain.
 *
 *    $ node addMarbles.js
 *
 * addMarbles will add 10 marbles by default with a starting marble name of "marble100".
 * Additional marbles will be added by incrementing the number at the end of the marble name.
 *
 * The properties for adding marbles are stored in addMarbles.json.  This file will be created
 * during the first execution of the utility if it does not exist.  The utility can be run
 * multiple times without changing the properties.  The nextMarbleNumber will be incremented and
 * stored in the JSON file.
 *
 *    {
 *        "nextMarbleNumber": 100,
 *        "numberMarblesToAdd": 10
 *    }
 *
 */

'use strict';

const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const addMarblesConfigFile = path.resolve(__dirname, 'addMarbles.json');

const colors=[ 'blue', 'red', 'yellow', 'green', 'white', 'purple' ];
const owners=[ 'tom', 'fred', 'julie', 'james', 'janet', 'henry', 'alice', 'marie', 'sam', 'debra', 'nancy'];
const sizes=[ 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 ];
const prices=[ 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000 ];
const docType='marble'

const config = require('./config.json');
const channelid = config.channelid;

async function main() {

    try {
        let nextMarbleNumber;
        let numberMarblesToAdd;
        let addMarblesConfig;

        // check to see if there is a config json defined
        if (fs.existsSync(addMarblesConfigFile)) {
            // read file the next marble and number of marbles to create
            let addMarblesConfigJSON = fs.readFileSync(addMarblesConfigFile, 'utf8');
            addMarblesConfig = JSON.parse(addMarblesConfigJSON);
            nextMarbleNumber = addMarblesConfig.nextMarbleNumber;
            numberMarblesToAdd = addMarblesConfig.numberMarblesToAdd;
        } else {
            nextMarbleNumber = 100;
            numberMarblesToAdd = 20;
            // create a default config and save
            addMarblesConfig = new Object;
            addMarblesConfig.nextMarbleNumber = nextMarbleNumber;
            addMarblesConfig.numberMarblesToAdd = numberMarblesToAdd;
            fs.writeFileSync(addMarblesConfigFile, JSON.stringify(addMarblesConfig, null, 2));
        }

        // Parse the connection profile. This would be the path to the file downloaded
        // from the IBM Blockchain Platform operational console.
        const ccpPath = path.resolve(__dirname, '..', 'test-network','organizations','peerOrganizations','org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Configure a wallet. This wallet must already be primed with an identity that
        // the application can use to interact with the peer node.
        const walletPath = path.resolve(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Create a new gateway, and connect to the gateway peer node(s). The identity
        // specified must already exist in the specified wallet.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });

        // Get the network channel that the smart contract is deployed to.
        const network = await gateway.getNetwork(channelid);

        // Get the smart contract from the network channel.
        const contract = network.getContract('marbles');

        addMarblesConfig.nextMarbleNumber = nextMarbleNumber + 1;

        fs.writeFileSync(addMarblesConfigFile, JSON.stringify(addMarblesConfig, null, 2));

        // let promises = [];
        // for (var counter = nextMarbleNumber; counter < nextMarbleNumber + numberMarblesToAdd; counter++) {
        //     promises.push(st());
        // }
        // Promise.allSettled(promises).then(values => console.log(values));
        // function st() {
        for (var counter = nextMarbleNumber; counter < nextMarbleNumber + numberMarblesToAdd; counter++) {
            var randomColor = Math.floor(Math.random() * (6));
            var randomOwner = Math.floor(Math.random() * (11));
            var randomSize = Math.floor(Math.random() * (10));
            var randomPrice = Math.floor(Math.random() * (10));


            let statefulTxn = contract.createTransaction('InitMarble');
            //if you need to customize endorsement to specific set of Orgs, use setEndorsingOrganizations
            //statefulTxn.setEndorsingOrganizations(mspOrg1);

            // Name  string `json:"name"` //the fieldtags are needed to keep case from bouncing around
            // Color string `json:"color"`
            // Size  int    `json:"size"`
            // Owner string `json:"owner"`
            // Price int
            let asset1Data = {
                Name: docType + counter,
                Color: colors[randomColor],
                Size: sizes[randomSize],
                Owner: owners[randomOwner],
                Price: prices[randomPrice]
            };
            let tmapData = Buffer.from(JSON.stringify(asset1Data));
            statefulTxn.setTransient({
                marble: tmapData
            });
            console.log("submitting...")
            console.log("Adding marble: ", JSON.stringify(asset1Data));
            await statefulTxn.submit();

            // Submit the 'initMarble' transaction to the smart contract, and wait for it
            // to be committed to the ledger.
            // await contract.submitTransaction('initMarble', docType+counter, colors[randomColor], ''+sizes[randomSize], owners[randomOwner]);
        }

        await gateway.disconnect();



    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
