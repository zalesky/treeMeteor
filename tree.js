Tree = new Mongo.Collection("tree");


if (Meteor.isClient) {
    Meteor.subscribe("tree");
    Template.utils.events({
        'click #clr': function () {
            Meteor.call('clearCollection')
        },
        'click #addTemplate': function () {
            Meteor.call('addTemplate')
        },
        'click #add10WidthTemplate': function () {
            Meteor.call('add10WidthTemplate')
        },
        'click #add': function () {
            Tree.insert({name: $('#textnode').val(), parent: null, earnings: 0, totalEarnings: 0});
            $('#textnode').val('');
        }

    });
}

if (Meteor.isClient) {
    Template.treeNode.events({
        'dblclick #companyName': function (e, t) {
            e.stopPropagation();
            return Session.set("TargetValue" + this._id, true);
        },
        'click #companyName': function (e, t) {
            e.stopPropagation();
            $(t.find('ul')).toggleClass("hide");
        },
        'click #addHere': function (e, t) {
            e.stopPropagation();
            Meteor.call('addCompanyHere', $(this)[0]._id);
        },
        'click #deleteThis': function (e, t) {
            e.stopPropagation();
            Meteor.call('deleteFromHere', $(this)[0]._id);
        },
        'keydown #newValueOfName': function (e) {
            var id = this._id;
            if (e.which == 27)return Session.set("TargetValue" + id, false);
            if (e.which != 13)return;
            Meteor.call('changeNameOfNode', id, $('#newValueOfName').val());
            return Session.set("TargetValue" + id, false); //we hide the input and we put the span again
        },
        'dblclick #earnings': function (e) {//change earnings
            e.stopPropagation();
            return Session.set("TargetValueEarnings" + this._id, true);//hide the span and we set the input
        },
        'keydown #newValueOfEarnings': function (e) {
            var id = this._id;
            if (e.which == 27)return Session.set("TargetValueEarnings" + id, false);
            if (e.which != 13)return;
            Meteor.call('changeEarnings', id, +$('#newValueOfEarnings').val());
            return Session.set("TargetValueEarnings" + id, false); //we hide the input and we put the span again
        }
    });
    Template.treeNode.helpers({
        'editValue': function () {
            return Session.get("TargetValue" + this._id);
        },
        'editValueEarnings': function () {
            return Session.get("TargetValueEarnings" + this._id);
        },
        'hasChildren': function () {
            return Tree.find({parent: this._id}).count() > 0;
        },
        'children': function () {
            return Tree.find({parent: this._id});
        },
        'childrenCount': function () {
            return Tree.find({parent: this._id}).count();
        }
    });
    Template.treeStart.helpers({
        'collectionFind': function () {
            return Tree.find({parent: null});
        }
    });
}
Meteor.methods({
    clearCollection: function (id, email) {
        Tree.remove({});
    },
    addTemplate: function () {
        if (Tree.find({}).count())Meteor.call('clearCollection');
        Tree.insert({name: 'Company1', parent: null, earnings: 4, totalEarnings: 40}, function (err, id) {
            if (!err) {
                Tree.insert({name: 'Company1child1', parent: id, earnings: 11, totalEarnings: 11});
                Tree.insert({name: 'Company1child2', parent: id, earnings: 12, totalEarnings: 12});
                Tree.insert({name: 'Company1child3', parent: id, earnings: 13, totalEarnings: 13});
            }
        });
        Tree.insert({name: 'Company2', parent: null, earnings: 2, totalEarnings: 22}, function (err, id) {
            if (!err) {
                Tree.insert({name: 'Company2child1', parent: id, earnings: 10, totalEarnings: 20}, function (err, id) {
                    if (!err) {
                        Tree.insert({name: 'Company2child1child1', parent: id, earnings: 10, totalEarnings: 10})
                    }

                })
            }

        });
        Tree.insert({name: 'Company3', parent: null, earnings: 17, totalEarnings: 27}, function (err, id) {
            if (!err) {
                Tree.insert({name: 'Company3child1', parent: id, earnings: 10, totalEarnings: 10})
            }

        });
    },
    changeNameOfNode: function (id, newValueOfName) {
        Tree.update({
            _id: id
        }, {
            $set: {
                name: newValueOfName
            }
        });

    },
    changeEarnings: function (id, newValueOfEarnings) {
        var current = Tree.findOne({_id: id}),
            value = (typeof newValueOfEarnings == 'number' ) ? newValueOfEarnings : 0,
            delta = value - current.earnings,
            totalEarnings = current.totalEarnings + delta,
            parent = current.parent;
        Meteor.call('updateEarnings', id, totalEarnings, value);

        while (parent) {
            //current = Tree.findOne({_id: parent});
            //console.log(parent);
            current = Tree.findOne({_id: parent});
            totalEarnings = current.totalEarnings + delta;
            Meteor.call('updateEarnings', current._id, totalEarnings);
            parent = current.parent;

        }
    },
    addCompanyHere: function (id) {
        var count = Tree.find({parent: id}).count();
        Tree.insert({parent: id, name: "Company" + count, earnings: 0, totalEarnings: 0});
    },
    deleteFromHere: function (id) {
        var current = Tree.findOne({_id: id}),
            delta = -1 * current.earnings,
            parent = current.parent;
        while (parent) {
            current = Tree.findOne({_id: parent});
            totalEarnings = current.totalEarnings + delta;
            Meteor.call('updateEarnings', current._id, totalEarnings);
            parent = current.parent;
        }

        var arrToDelete = [];
        arrToDelete = Tree.find({parent: id}).fetch();
        while (arrToDelete.length) {
            var idNow = arrToDelete[arrToDelete.length - 1]._id;
            if (countChild(idNow)) {
                arrToDelete = arrToDelete.concat(Tree.find({parent: idNow}).fetch());
            } else {
                Tree.remove({_id: idNow});
                arrToDelete.length = arrToDelete.length - 1;
            }
        }
        Tree.remove({_id: id});
        function countChild(id) {
            return Tree.find({parent: id}).count();
        }
    },
    updateEarnings: function (id, totalEarnings, earnings) {
        if (arguments.length == 3) {
            Tree.update({
                _id: id
            }, {
                $set: {
                    earnings: earnings,
                    totalEarnings: totalEarnings
                }
            });
        } else {
            Tree.update({
                _id: id
            }, {
                $set: {
                    totalEarnings: totalEarnings
                }
            });
        }

    },
    add10WidthTemplate: function () {
        if (Tree.find({}).count())Meteor.call('clearCollection');
        var i = 10;
        (function insertNode(id) {
            if (!i)return true;
            Tree.insert({name: 'Company' + (10 - i), parent: id, earnings: 1, totalEarnings: i--}, function (err, id) {
                insertNode(id);
            });
        })(null)
    }

});
