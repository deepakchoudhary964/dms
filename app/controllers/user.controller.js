const mongoose = require('mongoose');
const User = mongoose.model('User');
const { generateUserPasswordHash } = require('../services/user');
const jwt = require('../services/jwt');

const config = require('../../config');
var stripe = require('stripe')(config.stripe.private_key);

const changePassword = (req, res, next) => {
    User.where({ _id: req.user._id }).update({
        $set: {
            hashed_password: generateUserPasswordHash(req.body.password)
        }
    }, (err, user) => {
        if (err) return next(err);
        next();
    });
};

const update = (req, res, next) => {
    let data = {};
    if (undefined !== req.body.first_name) data.first_name = req.body.first_name;
    if (undefined !== req.body.last_name) data.last_name = req.body.last_name;
    if (undefined !== req.body.city) data.city = req.body.city;
    if (undefined !== req.body.instruments) data.instruments = req.body.instruments;
    if (undefined !== req.body.downloads) data.downloads = req.body.downloads;
    if (undefined !== req.body.birthday) data.birthday = req.body.birthday;
    if (undefined !== req.body.subscribe_partners) data.subscribe_partners = req.body.subscribe_partners;
    User.where({ _id: req.user._id }).update({ $set: data }, (err, user) => {
        if (err) return next(err);
        User.findOne({ _id: req.user._id }, (err, user) => {
            if (err) return next(err);
            req.user = user;
            next();
        });
    });
};
const deleteRecord = (req, res) => {
    var delRecorcd = false;
    let id = req.params.id;
    const token = req.headers.authorization.split(' ')[1];

    const payload = jwt.decodeToken(token);
    User.findById({ _id: payload.id }, (err, users) => {
        if (err) {
            return res.status(404).send(err);
        }
        var oneRecords = [];
        for(let k=0; k<users.records.length; k++){

                oneRecords.push(users.records[k]);
        }
        
        for (let i = 0; i < users.records.length; i++) {
            var obj =users.records[i];
            if (users.records[i] && (id == obj.compositionid)) {
                if (users.records.indexOf(obj.compositionid) == -1) {
                    users.records.splice(i, 1);                   
                    delRecorcd = true;                                   
                }
            }
            
        } 
      
        if (delRecorcd) {
            
            User.where({ _id: payload.id }).update({ $set: users }, (err, user) => {
                if (err) {
                    return res.status(500).send(err);
                }
                return res.status(200).json(users);
            });
        }

    })

};

const createRecord = (req, res) => {

    let recordsCollections = [];
    for (let i = 0; i < req.body.records.length; i++) {
        let recordObj = {};
        if (undefined !== req.body.records[i].compositionid) recordObj.compositionid = req.body.records[i].compositionid;
        if (undefined !== req.body.records[i].filename) recordObj.filename = req.body.records[i].filename;
        if (undefined !== req.body.records[i].fileurl) recordObj.fileurl = req.body.records[i].fileurl;
        recordsCollections.push(recordObj);
    }

    const token = req.headers.authorization.split(' ')[1];

    const payload = jwt.decodeToken(token);

    User.findById({ _id: payload.id }, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        var sameComposition = false;
        for (let k = 0; k < result.records.length; k++) {
            for (let l = 0; l < recordsCollections.length; l++) {
                if (result.records[k] && ((result.records[k].compositionid === recordsCollections[l].compositionid) || (result.records[k].filename === recordsCollections[l].filename) || (result.records[k].fileurl === recordsCollections[l].fileurl))) {
                    var sameComposition = true;
                    return res.status(404).send({ err: 'records value should be unique' })
                  
                }
            }
            if (sameComposition) {
                break;
            }

        }
        if (!sameComposition) {
            for (let j = 0; j < recordsCollections.length; j++) {
                result.records.push(recordsCollections[j]);
            }
        }
        if (!sameComposition) {
            User.where({ _id: payload.id }).update({ $set: result }, (err, user) => {
                if (err) {
                    return res.status(500).send(err);
                }
                return res.status(200).json(result);
            });

        }
    });


};
const findOnecompositionRecord = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const payload = jwt.decodeToken(token);
    User.findById({ _id: payload.id }, (err, users) => {
        if (err) {
            return res.status(404).send(err);
        }
        var oneRecords = users.records;

        for (let k = 0; k < oneRecords.length; k++) {
            if (oneRecords[k] && oneRecords[k].compositionid == req.params.id) {
                var compositionRecord = oneRecords[k]
            }
        }
        return res.status(200).json(compositionRecord);


    })

};
const findAll = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];

    const payload = jwt.decodeToken(token);
    User.findById({ _id: payload.id }, (err, users) => {
        if (err) {
            return res.status(404).send(err);
        }
        let allRecords = users.records
        return res.status(200).json(allRecords);
    })


};

/*
const getStripeCustomer = (user) => {
   if (user && user.stripeId) {
      return stripe.customers.createSource(user.stripeId, { source: user && user.stripe.tokenId ? user.stripe.tokenId || 'tok_visa' });
   }
   else {
      return stripe.customers.create({ email: user.email}).then(function(customer){
         var data = {stripeId: customer.id };
         user.update({ $set: data}, (err, user) => {});
        return stripe.customers.createSource(customer.id, { source: user && user.stripe.tokenId ? user.stripe.tokenId || 'tok_visa' });
      })
   }
}
*/

const updateCard = (req, res) => {
    const { email, cardNumber, expMonth, expYear, cvc } = req.body;
    stripe.tokens.create({
        card: {
            "number": cardNumber,
            "exp_month": expMonth,
            "exp_year": expYear,
            "cvc": cvc
        }
    }, function (err, token) {
        const data = { stripe: { tokenId: token } };
        User.where({ email: email }).update({ $set: data }, (err, user) => {
            res.json({})
        });
    });
}

const payTransaction = (req, res) => {

    //stripe call with email address
    User.findOne({ email: email }, (err, user) => {
        getStripeCustomer(user)
            .then(function (source) {
                return stripe.charges.create({
                    amount: amountInCents,
                    currency: currency || 'usd',
                    customer: source.customer
                });
            }).then(function (charge) {
                res.json(charge);
            }).catch(function (err) {
                res.json(err);
            });
    });
}


module.exports = {
    changePassword: changePassword,
    update: update,
    payTransaction: payTransaction,
    updateCard: updateCard,
    createRecord: createRecord,
    findOnecompositionRecord: findOnecompositionRecord,
    findAll: findAll,
    deleteRecord: deleteRecord
};
