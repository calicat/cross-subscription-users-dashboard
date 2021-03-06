Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',



    getUserInfo : function() {
    	
		var deferred = Ext.create('Deft.Deferred');

    	var that = this;
    	
    	that.showMask("Loading user info...");

    	this._loadAStoreWithAPromise( "User",
    		["UserName","Disabled","LastLoginDate"],
    		[{Property:"ObjectID",Operator:"!=",Value:0}])
				.then({
					success : function(records) {
						that.hideMask();
						deferred.resolve({
							total    : records.length,
							enabled  : _.filter(records,function(r){return r.get("Disabled")===false;}).length,
							disabled : _.filter(records,function(r){return r.get("Disabled")===true;}).length,
							loggedIn30 : _.filter(records,function(r){return that.loggedIn30(r);}).length
						});
					}
				});

		return deferred.promise;
    },

    loggedIn30 : function( user ) {

    	if (_.isNull(user.get("LastLoginDate")))
    		return false;

    	var dt = Rally.util.DateTime.getDifference(new Date(), user.get("LastLoginDate"), 'day');
    	return dt <= 30;
    },

    _loadAStoreWithAPromise : function( model_name, model_fields, filters,ctx,order) {

		var deferred = Ext.create('Deft.Deferred');
		var me = this;

		var config = {
			model: model_name,
			fetch: model_fields,
			filters: filters,
			limit: 'Infinity'
		};
		if (!_.isUndefined(ctx)&&!_.isNull(ctx)) {
			config.context = ctx;
		}
		if (!_.isUndefined(order)&&!_.isNull(order)) {
			config.order = order;
		}

		Ext.create('Rally.data.wsapi.Store', config ).load({
			callback : function(records, operation, successful) {
				if (successful){
					deferred.resolve(records);
				} else {
					deferred.reject('Problem loading: ' + operation.error.errors.join('. '));
				}
			}
		});
		return deferred.promise;
	},

	fields : [
		{
			displayName: 'Total',
			name: 'total'
		},
		{
			displayName: 'Enabled',
			name: 'enabled'
		},
		{
			displayName: 'Disabled',
			name: 'disabled'
		},
		{
			displayName: 'LoggedIn30',
			name: 'loggedIn30'
		}
	],
	
    showMask: function(msg) {
        if ( this.getEl() ) { 
            this.getEl().unmask();
            this.getEl().mask(msg);
        }
    },
    hideMask: function() {
        this.getEl().unmask();
    },

    launch: function() {

    	var that = this;
    	
    	console.log(that.getContext().getSubscription());
    	
    	that.add({html:that.getContext().getSubscription()._refObjectName+"<p/>"});


    	that.getUserInfo().then({
    		success : function(data) {
    			console.log("data",data);
    			var store = Ext.create('Ext.data.JsonStore', {
	            	fields : that.fields,
	            	data : [data]
        		});

        		var grid = new Ext.grid.GridPanel({
        			store : store,
        			columns : _.map(that.fields,function(f){
        				return {
        					text: f.displayName,
                        	dataIndex: f.name
        				}
        			}),
        			width:500
    			});

    			that.add(grid);
			}    			
    	});

    	// var promises = _.map(this.keys,function(key) {
    	// 	return that.getSeatInfo(key);
    	// });

    	// Deft.Promise.all(promises).then({
    	// 	success : function(records) {
    	// 		console.log(records);
    	// 	}
    	// })
    }
});
