/*
5/3/11 - edits to ensure reseller level functionality
5/4/11 - add CustomTraining asset type
6/21/11 - #704 clear user lock if it gets hung up
*/
  
		$.trVars = {
			"tree":"",
			"menu":"",
			"rootFolderId":"1",
			"assetIcons":{"Member":"member.png",
							"member":"member.png",
							"Document":"document.gif",
							"document":"document.gif",
							"Course":"course.gif",
							"course":"course.gif",
							"CustomTraining":"customTraining.gif",
							"customtraining":"customTraining.gif",
							"customTraining":"customTraining.gif",
							"Group":"folderClosed.gif",
							"Company":"company.gif",
							"GroupAsset":"folderClosed.gif",
							"GroupMember":"folderClosed.gif"},
			"imageDir":"../groupTree/images/custom/",
			"xmlFile_menu":"/groupTree/contextmenu.xml",
			"imgSrcGroupMember":"http://grainger.safetycertified.com/~UI/Images/GroupTree/groupMember.png",
			"imgSrcGroupAsset":"http://grainger.safetycertified.com/~UI/Images/GroupTree/groupAsset.png",
			"treeIdSelected":"",
			"treeMultiSelectState":"off",
			"treeMultiSelectId":"",
			"treeSubItems":"",
			"treeAssettype":"",
			"itemCheckboxes":"",
			"treeRecordIdSelected":"",
			"treeFolderTypeSelected":"",
			"treeMoveIdList":"",
			"treeNewId":"",
			"treeNewName":"",
			"treeParentId":"",
			"treeStorage":"",
			"treeAction":"load",
			"treeNodesView":"",
			"treeNodesCalculatedView":"",
			"treeNodesInObject":"",
			"treeNodesRecalculated":"",
			"treeContextMenuState":"on",
			"appCustId":"",
			"appCustType":"",
			"appContext":"",
			"debugMode":"off"
		};	

        $(document).ready(function() {
	
            $.urlParam = function(name) {
                var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
                if (!results) { return 0; }
                return results[1] || 0;
            }
			
			/* Get querystring parms */
			$.trVars.appCustId 		= $.urlParam("cid");
			$.trVars.appCustType 	= $.urlParam("type");
			$.trVars.appContext 	= $.urlParam("context");
			if ($.urlParam("debug")=="1") $.trVars.debugMode = "on";
			if ($.trVars.debugMode=="on") $("#tbl_debugTree").toggle();
			if ($.urlParam("menu")=="off") $.trVars.treeContextMenuState = "off";
			if ($.urlParam("memberid")!="") openMemberProfile($.urlParam("memberid"),"0");
			if ($.urlParam("companyid")!="") openCompanyProfile($.urlParam("companyid"));
			
			/* Setup DatePickers */
			 $("#txtDueDate").datepicker();
			 $("#txtRecurDate").datepicker();
			 var today = new Date(); 
			 $("#txtDueDate").datepicker( "setDate" , today.defaultView() );
			
			/* Setup TREE load */
            $.LoadJSON = function() {
				if ($.urlParam("cid") == "") {
					$.handleErrorMsg("Error:Context parameters not supplied in querystring");
					return false;
				}

				$("#treeBox").html();
				$.trVars.tree = "";
				$.trVars.menu = "";
				
				//initialize Context menu
				$.trVars.menu = new dhtmlXMenuObject();
				$.trVars.menu.setIconsPath($.trVars.imageDir);
				$.trVars.menu.renderAsContextMenu();
				$.trVars.menu.attachEvent("onClick", onButtonClick);
				$.trVars.menu.loadXML($.trVars.xmlFile_menu);  
				
				//initialize dhtmlxTree object
				$.trVars.tree = new dhtmlXTreeObject("treeBox","100%","100%",0);
				$.trVars.tree.setImagePath($.trVars.imageDir);
				$.trVars.tree.enableHighlighting(true);
				//$.trVars.tree.enableCheckBoxes(true,true);
				$.trVars.tree.attachEvent("onClick",function() {
						//$("#divTreeMsg").html($.trVars.tree.getSelectedItemId());
					});
				//finish contextMenu logic now that the tree is instantiated
				$.trVars.tree.enableContextMenu($.trVars.menu);
				$.trVars.tree.attachEvent("onBeforeContextMenu", function(itemId) {
					setupContextMenu(itemId);
					return true;
				});
				try {
					$.blockUI({message:$.setWaitMsg("Assignments are loading...")});
				} catch (blockUILoadErr) {}
				$.loadTreeFromDatabase();
            }
			
			//-------------------------------
			// Initial Load of Tree
			//-------------------------------
            $.LoadJSON();
			//
        });

		$.loadTreeFromDatabase = function() {
				var parms = {ApplicationCustomerId: $.trVars.appCustId, 
							 ApplicationCustomerType: "\"" + $.trVars.appCustType + "\"", 
							 Context: "\"" + $.trVars.appContext + "\""};
		        $.ajax({
                    url: "http://" + location.host + "/Services_LMS/GroupWS.asmx/GetGroupTree",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
                        //debugger;
						if ($.trVars.debugMode=="on") $("#divDebugJsonLoad").html(msg);
						//this is where the tree gets loaded
						try {
							var obj = jQuery.parseJSON(msg);
							$.trVars.tree.loadJSONObject(obj, function() {
								$.clearMsg();
								$.trVars.tree.selectItem($.trVars.rootFolderId);
								$.sortTree();
								try {
									//$.trVars.tree.showItemCheckbox($.trVars.rootFolderId,false);
									var subItems_Array = $.trVars.tree.getAllSubItems($.trVars.rootFolderId).split(",");
									$.each(subItems_Array, function(idx, val) {  
										//$.trVars.tree.showItemCheckbox(val,false);
										$.setNodeTextIcon(val);
									});
								} catch(loadFormatErr) {}
								if ($.urlParam("expand")=="all") $.trVars.tree.openAllItems($.trVars.rootFolderId);
							}); 
						} catch (loadErr) {
							$.handleErrorMsg("error loading/formatting tree data. " + loadErr);
						}
                    },
                    error: function(msg) {
                        //debugger;
                        $.handleErrorMsg("Error in page load." + jQuery.parseJSON(msg));
                    },
                    complete: function() {
                        // unblock when remote call returns 
						toggleDiv('welcome');
						if ($.urlParam("loadview")=="resellercompany") toggleDiv('ResellerCompany');
                        //debugger;
                    }
                });
		}
		$.setTreeLock = function() {
				var treeId = $.trVars.tree.getUserData($.trVars.rootFolderId,"Id");
				var status = "";
				var action = "start";
				var parms = "treeId="+treeId+"&custType="+$.trVars.appCustType+"&custId="+$.trVars.appCustId+"&action="+action+"&status="+status;
                $.ajax({
                    url: "http://" + location.host + "/groupTree/call$manageGroupSession.asp?",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: parms,
                    dataType: "html",
                    success: function(msg) {
                        //debugger;
						try {
							if (msg=="IN") {
								$.trVars.treeContextMenuState = "on";
							} else {
								//Lock the tree read-only
								$.setGroupToolToReadOnly(msg);							
							}
							//$.handleInfoMsg("/groupTree/call$manageGroupSession.asp?" + parms);
						} catch (errTokens) {
							$.handleErrorMsg("Processing Error attempting to set tree lock. " + msg);
						}
                    },
                    error: function(msg) {
                        //debugger;
                        $.handleErrorMsg("Error in set tree lock. " + msg);
                    },
                    complete: function() {
                        //debugger;
                    }
                });
		}

		$.setGroupToolToReadOnly = function(parm) {
			var msg = parm+"";
			$.trVars.treeContextMenuState = "off";
			if (msg.length>0) $.handleErrorMsg(msg);
			//disable the wizard tab, see function tabsGroup(label) in groupTreeHandleTemplates.js
			$("#tabAssign").css("color","#c0c0c0");
			//disable all buttons that are not "Cancel" or minimize "-"
			var inputButtons = $(":button");
			$.each(inputButtons,function(idx, val) {
				if (val.value!="Cancel" && val.value!="-") {
					val.disabled=true;
				}	
			});
		}
	
        $(document).ready(function() {
            (function($) {
                var _ajax = $.ajax,
                A = $.ajax = function(options) {
                    if (A.data)
                        if (options.data) {
                        if (typeof options.data !== 'string')
                            options.data = $.param(options.data);
                        if (typeof A.data !== 'string')
                            A.data = $.param(A.data);
                        options.data += '&' + A.data;
                    } else
                        options.data = A.data;
                    return _ajax(options);
                };
            })(jQuery);
			
            ////debugger;
            if ($.urlParam && $.urlParam.call) {
                $.ajax.data = { responseType: "json" };
            }
        });
			
		function unloadGroupTree() {
			try {
				var treeId = $.trVars.tree.getUserData($.trVars.rootFolderId,"Id");
			} catch (wuerr) {};
			var status = "";
			var action = "stop";
			var parms = "treeId="+treeId+"&custType="+$.trVars.appCustType+"&custId="+$.trVars.appCustId+"&action="+action+"&status="+status;
			//alert(parms);
            $.ajax({
                    url: "http://" + location.host + "/groupTree/call$manageGroupSession.asp?",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: parms,
                    dataType: "html",
                    success: function(msg) {
                        //debugger;
						//alert(msg);
                    },
                    error: function(msg) {
                        //debugger;
                        //$.handleErrorMsg("Error in page unload. " + msg);
                    },
                    complete: function() {
                        //debugger;
                    }
            });
		}
		window.onunload = unloadGroupTree;
		
	//-------------------------------------
	// Error Checking functions
	//-------------------------------------
			$.clearMsg = function(str) {
				$("#divTreeMsg").html("");
			}
			$.handleErrorMsg = function(str) {
				$("#divTreeMsg").html(str);
				if (str.length>0) alert(str);
				try {
					if ($.tandemAjaxCalls.status=="inProgress") $.tandemAjaxCalls.abortTandem();
				} catch (herrmsg) {}
				try {$.unblockUI();} catch (unblockerr) {}
			}
			$.handleInfoMsg = function(str) {
				var infoSpan = "";
				if (str.length>0) infoSpan = "<span style=\"color:blue;font-weight:bold;\">"+str+"</span>";
				$("#divTreeMsg").html(infoSpan);
			}
			$.isFolderNode = function(type) {
				if (type == "Group") {
					return true;
				} else { return false; }
			}
			$.isGroupLevelNode = function(type) {
				if ((type=="Group") || (type=="Group.Asset") || (type=="Group.Member")) {
					return true;
				} else { return false; }
			}
			$.isLeafNode = function(type) {
				if ((type=="Member") || (type=="Course") || (type=="Document") || (type=="Company") || (type=="CustomTraining")) {
					return true;
				} else { return false; }
			}
			$.isRootNode = function(id) {
				if ((id == $.trVars.rootFolderId) || (id == "0")) {
					return true;
				} else { return false; }
			}
			$.isNodeSelected = function(id) {
				if (id==null || id=="") {
					return false;
				} else { return true; }
			}
			$.isValidGroupName = function(id,name) {
				if (name!=null && name!="") {
					//
				} else {
					$.handleErrorMsg("Enter a name, or click 'add group' to cancel");
					return false;
				}
				return true;
			}
			$.isValidNamedGroupDrop = function(id,type) {
				//id is item being copied/moved, type is of the destination folder
				//only member related idType can be dropped in a member folder
				//only asset related idType can be dropped in an asset folder
				var idType = $.getUserData(id,"type")
				if (type=="Group.Member") {
					if (idType=="Group" || idType=="Group.Member" || idType=="Member" || idType=="Company") {
						return true;
					} else { return false };
				}
				if (type=="Group.Asset") {
					if (idType=="Group" || idType=="Group.Asset" || idType=="Course" || idType=="Document" || idType=="CustomTraining") {
						return true;
					} else { return false };
				}
				return true;
			}
			$.isDuplicateGroupName = function(id,name) {
				var ids = $.trVars.tree.getSubItems(id);
				var idsArr = ids.split(",");
				for (idup=0;idup<idsArr.length;idup++) {
					if (determineType(idsArr[idup])=="Group") {
						if ($.trVars.tree.getItemText(idsArr[idup]) == name) {
							$.handleErrorMsg("A Group Folder with this name already exists at this level.");
							return true;
						}
					}
				}
				return false;
			}
			$.isDuplicateAsset = function(assettype,id,name) {
				var ids = $.trVars.tree.getSubItems(id);
				var idsArr = ids.split(",");
				for (idup=0;idup<idsArr.length;idup++) {
					if (determineType(idsArr[idup])==assettype) {
						if ($.trVars.tree.getItemText(idsArr[idup]) == name) {
							return true;
						}
					}
				}
				return false;
			}
			$.validateNamedGroupDrop = function(list,type) {
					var IdListArr = list.split(",");
					var ret = true;
					$.each(IdListArr,function(idx, val) {
						if (!$.isValidNamedGroupDrop(val,type)) {
							ret = false;
						}	
					});
					return ret;
			}
			
		//-----------------------------------------------------------------------
		// checkTokens - if the assignments resulting from the action exceed the
		// unassignedCourseCount left for the companies affected, stop the action
		//-----------------------------------------------------------------------
		$.checkTokens = function(p_action,assettype) {
				$.trVars.treeAction = p_action + assettype;  //assettype will be "" for copy/move
				var id = $.trVars.tree.getSelectedItemId();
				if (!$.isNodeSelected(id)) 
				{
					$.handleErrorMsg("Please select a folder group item first");
					return false;
				}
				var type = determineType(id);
				if ($.isLeafNode(type)) 
				{
					$.handleErrorMsg("You cannot perform this action for an individual item. Please select a folder level Group first.");
					return false;
				}
				//
				$.blockUI({message:$.setWaitMsg("Checking remaining tokens...")});
				$.trVars.treeStorage = "";  //clear out any previously held nodes in case there is an error 
				var mids = "";
				var cids = "";
				var ids = "";
				var compids = "";
				var targetId = $.getUserData(id,"Id");  //destination folder groupId
				var context = $.trVars.appCustType;
				var custId = $.trVars.appCustId;
				var action = p_action;
				var sourceId = $.getUserData($.trVars.treeIdSelected,"Id");
				if (assettype=="Member") {
						var cbxArr = document.getElementsByName("cbx"+assettype);
						var IdList = "";
							for (cx=0;cx<cbxArr.length;cx++) {
								if (cbxArr[cx].checked==true) {
									cbxLabel = document.getElementById(cbxArr[cx].id+"_lbl").innerHTML;
									if (!$.isDuplicateAsset(assettype,id,cbxLabel)) {
										IdList += cbxArr[cx].value + ",";
									} else {
										document.getElementById(cbxArr[cx].id).checked=false;
									}
								}
							}
						mids = removeEndingComma(IdList);
				} else if (assettype=="Course") {
						var cbxArr = document.getElementsByName("cbx"+assettype);
						var IdList = "";
							for (cx=0;cx<cbxArr.length;cx++) {
								if (cbxArr[cx].checked==true) {
									cbxLabel = document.getElementById(cbxArr[cx].id+"_lbl").innerHTML;
									if (!$.isDuplicateAsset(assettype,id,cbxLabel)) {
										IdList += cbxArr[cx].value + ",";
									} else {
										document.getElementById(cbxArr[cx].id).checked=false;
									}
								}
							}
						cids = removeEndingComma(IdList);
				} else if (assettype=="Company") {
						var cbxArr = document.getElementsByName("cbx"+assettype);
						var IdList = "";
							for (cx=0;cx<cbxArr.length;cx++) {
								if (cbxArr[cx].checked==true) {
									cbxLabel = document.getElementById(cbxArr[cx].id+"_lbl").innerHTML;
									if (!$.isDuplicateAsset(assettype,id,cbxLabel)) {
										IdList += cbxArr[cx].value + ",";
									} else {
										document.getElementById(cbxArr[cx].id).checked=false;
									}
								}
							}
						compids = removeEndingComma(IdList);
				} else if (assettype=="") {
					ids = "";  //set the ids on a copy/move
					if ($.validateNamedGroupDrop($.trVars.treeMoveIdList,type)) {
						var IdListArr = $.trVars.treeMoveIdList.split(",");
						$.each(IdListArr,function(idx, val) {
							try {
								ids += $.getUserData(val,"Id") + ",";
							} catch(tokenErr1) {
								$.handleErrorMsg("Error ocurred in token check. Unable to retrieve userData values.");
								return false;
							}	
						});
					} else {
						if (type=="Group.Member") {
							$.handleErrorMsg("Only members are allowed in this Named Group folder. Action cancelled.");
						} else if (type=="Group.Asset") {
							$.handleErrorMsg("Only courses and documents are allowed in this Named Group folder. Action cancelled.");
						}
						if ($.trVars.treeAction=="copy") {
							$.copyCancel();
						} else if ($.trVars.treeAction=="move") {
							$.moveItemsCancel();
						}
						return false;
					}
					if (ids == "") return false;
					ids=removeEndingComma(ids);
				}
				
				if (mids.length==0 && cids.length==0 && compids.length==0 && ids.length==0) {
					$.handleErrorMsg("Items selected may be duplicates. Action cancelled");
					if ($.trVars.treeAction=="copy") {
						$.copyCancel();
					} else if ($.trVars.treeAction=="move") {
						$.moveItemsCancel();
					}
					return false;
				}
				var parms = "mids="+mids+"&cids="+cids+"&compids="+compids+"&ids="+ids+"&targetId="+targetId+"&context="+context+"&custId="+custId+"&action="+action+"&sourceId="+sourceId;
				if ($.trVars.debugMode=="on") {
					$("#spDebugMessage").html(parms + "&debug=1");
					if (!confirm("calculate Tokens\n" + "\nmids=" + mids +	"\ncompids=" + compids +
									"\ncids=" + cids + 
									"\nids=" + ids +
									"\ntargetId=" + targetId +
									"\ncontext=" + context +
									"\ncustId=" + custId +
									"\naction=" + action +
									"\nsourceId=" + sourceId + 
									"\n\ncontinue?")) {
						$.handleErrorMsg("");
						return false;
						}
					
				}
                $.ajax({
                    url: "http://" + location.host + "/groupTree/call$calculateTokens.asp?",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: parms,
                    dataType: "html",
                    success: function(msg) {
                        //debugger;
						try {
							if ($.trVars.debugMode=="on") {
								if (confirm("callback from token check\n\n" + msg + "\n\nContinue??")) {
									//
								} else {
									if ($.trVars.treeAction=="copy") {
										$.copyCancel();
										return false;
									} else if ($.trVars.treeAction=="move") {
										$.moveItemsCancel();
										return false;
									}
									return false;
								}
							}
							//end testing
							if (msg.substr(0,7)=="success") {
							   if ($.trVars.treeAction=="addCourse") {
								  $.addAsset("Course");
							   } else if ($.trVars.treeAction=="addMember") {
								  $.addAsset("Member");
							   } else if ($.trVars.treeAction=="addCompany") {
								  $.addAsset("Company");
							   } else if ($.trVars.treeAction=="copy") {
									$.copyPaste();
							   } else if ($.trVars.treeAction=="move") {
									$.moveItemsDrop();
							   }
							} else {
								$.handleErrorMsg("This action will exceed the token threashold for these companies:\n\n" + removeEndingComma(msg) + "\n\nAction Cancelled");
								if ($.trVars.treeAction=="copy") {
									$.copyCancel();
								} else if ($.trVars.treeAction=="move") {
									$.moveItemsCancel();
								}
							}
						} catch (errTokens) {
							$.handleErrorMsg("Processing Error after token check.");
							if ($.trVars.treeAction=="copy") {
								$.copyCancel();
							} else if ($.trVars.treeAction=="move") {
								$.moveItemsCancel();
							}
						}
                    },
                    error: function(msg) {
                        //debugger;
                        $.handleErrorMsg("Error." + msg);
						if ($.trVars.treeAction=="copy") {
							$.copyCancel();
						} else if ($.trVars.treeAction=="move") {
							$.moveItemsCancel();
						}
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;
                    }
                });
			}
			//
			$.checkTokens_Wizard = function(peopleTemplates, trainingTemplates, destNode) {
				$.trVars.treeAction = "wizardTokenCheck";   
				var targetId =  $.getUserData(destNode,"Id");  //destination folder groupId
				//
				//////if ($.trVars.debugMode=="on") { targetId = 4357; }
				//
				$.trVars.treeIdSelected = destNode;
				var context = $.trVars.appCustType;
				var custId = $.trVars.appCustId;
				var action = "wizard";	
				if ((peopleTemplates.length==0) || (trainingTemplates.length==0)) {
					$.handleErrorMsg("No inputs, cannot determine token impact");
					return false;
				}
				var parms = "pts="+encodeURI(peopleTemplates)+"&tts="+encodeURI(trainingTemplates)+"&targetId="+targetId+"&context="+context+"&custId="+custId+"&action="+action;
				if ($.trVars.debugMode=="on") {
					$("#spDebugMessage").html("http://" + location.host + "/groupTree/call$calculateTokens_Wizard.asp?" + parms + "&debug=1");
					/*
					if (!confirm("calculate Wizard Tokens\n" + 
									"\npts=" + peopleTemplates + 
									"\ntts=" + trainingTemplates +
									"\ntargetId=" + targetId +
									"\ncontext=" + context +
									"\ncustId=" + custId +
									"\naction=" + action +
									"\n\ncontinue?")) {
						$.handleErrorMsg("");
						return false;
						}
					*/
				}
				//$.blockUI({message:$.setWaitMsg("Checking remaining tokens...")});
                $.ajax({
                    url: "http://" + location.host + "/groupTree/call$calculateTokens_Wizard.asp?",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: parms,
                    dataType: "html",
                    success: function(msg) {
                        //debugger;
						try {
							if ($.trVars.debugMode=="on") {
								if (confirm("callback from token check\n\n" + msg + "\n\nContinue??")) {
									//
								} else {
									$.handleErrorMsg("");
									return false;
								}
							}
							//end testing
							if (msg.substr(0,7)=="success") {
							   if ($.tandemAjaxCalls.status=="inProgress") $.tandemAjaxCalls.callTandemAjax();
							} else {
								var doDelete = ($.tandemAjaxCalls.status=="inProgress") ? true : false;
								$.handleErrorMsg("This action will exceed the token threshold for these companies:\n\n" + removeEndingComma(msg) + "\n\nAction Cancelled");
								if (doDelete) $.deleteNode() ;
								return false;
							}
						} catch (errTokens) {
							$.handleErrorMsg("Token check failed. Return Invalid. msg." + msg);
							return false;
						}
                    },
                    error: function(msg) {
                        //debugger;
                        $.handleErrorMsg("Error." + msg);
						return false;
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;
                    }
                });

			}
			
	//-------------------------------------------
	// Menu Actions
	//-------------------------------------------
	//-------------------------------------------
	//-------------------------------------------
	// Add Group Folder
	//-------------------------------------------
			$.addFolder = function() {
				$.trVars.treeAction = "addGroup";
				var id = $.trVars.tree.getSelectedItemId();
				$.trVars.treeIdSelected = id;
				var name = document.getElementById("txtGroup_Add").value;
				if (!$.isNodeSelected(id)) 
				{
					$.handleErrorMsg("Please select a folder group item first");
					return false;
				}
				var type = determineType(id);
				if ($.isLeafNode(type)) 
				{
					$.handleErrorMsg("You cannot perform this action for an individual item. Please select a folder level Group first.");
					return false;
				}
				if (!$.isValidGroupName(id,name)) return false;
				if ($.isDuplicateGroupName(id,name)) return false;
				//Perform action
				var newid = calculateId(id); //this will be +1 off the last child under the parent
				var newObjectId = "";
				try {
					var parentId = $.trVars.tree.getUserData(id,"Id");
				} catch (errAddGroupParentIdChk) {
					$.handleErrorMsg("Unable to determine objectId, Add cancelled");
					return false;
				}
				var parms = {ApplicationCustomerId: $.trVars.appCustId, 
							 ApplicationCustomerType: "\"" + $.trVars.appCustType + "\"", 
							 Context: "\"" + $.trVars.appContext + "\"" ,
							 ParentId: parentId ,
							 Type: "\"" + "Group" + "\"" ,
							 Value: "\"" + name + "\"" ,
							 NodeId: "\"" + newid + "\"" ,
							 ObjectId: 0
						   };
				if ($.trVars.debugMode=="on") {
					alert("IN $.addFolder\n\nparentid: " + parms.ParentId + "," + parms.Type + "," + parms.Value + "," + parms.NodeId);
				}
				$.blockUI({message:$.setWaitMsg("Adding new folder...")});
				$.trVars.treeNewId = newid;
				$.trVars.treeNewName = name;
				$.trVars.treeParentId = parentId;
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/GroupWS.asmx/AddTreeNode",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
                        //debugger;
                        //alert("msg." + msg);
						try {
							if (isNumber(msg))
							{
								var newObjectId = msg;
								$.trVars.tree.insertNewChild($.trVars.treeIdSelected,$.trVars.treeNewId,$.trVars.treeNewName,0,0,0,0,"SELECT");
								$.trVars.tree.setItemImage($.trVars.treeNewId,eval("$.trVars.assetIcons.Group"));
								$.trVars.tree.setUserData($.trVars.treeNewId,"type","Group");
								$.trVars.tree.setUserData($.trVars.treeNewId,"parentId",$.trVars.treeParentId);
								$.trVars.tree.setUserData($.trVars.treeNewId,"Id",newObjectId);
								if ($.tandemAjaxCalls.status=="inProgress") {
									$.templateVars.assignmentNewFolderNode = $.trVars.treeNewId;
									$.tandemAjaxCalls.callTandemAjax();
								} else {
									$.sortTree(); 
									toggleDiv(''); 
								}
							} else {
								$.handleErrorMsg("Add Group Folder failed. Return Invalid. msg." + msg);
							}
						} catch (errAddFolder) {
							$.handleErrorMsg("Add Group Folder failed. msg." + msg);
						}
                    },
                    error: function(msg) {
                        //debugger;
                        $.handleErrorMsg("Error in Add Group Folder." + msg);
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;
                    }
                });
			}
					
	//-------------------------------------------
	// Add Named Group Folder of Asset, Member
	//-------------------------------------------
			$.addNamedGroup = function(p_type) {
				$.trVars.treeAction = "addGroup";
				var id = $.trVars.tree.getSelectedItemId();
				//alert("In addNamedGroup for " + p_type + ",selectedNode:" + id);
				$.trVars.treeIdSelected = id;
				if (!$.isNodeSelected(id)) 
				{
					$.handleErrorMsg("Please select a folder group item first");
					return false;
				}
				var type = determineType(id);
				if ($.isLeafNode(type)) 
				{
					$.handleErrorMsg("You cannot perform this action for an individual item. Please select a folder level Group first.");
					return false;
				}
				$.blockUI({message:$.setWaitMsg("Adding named group folder...")});
				//determine whether they are importing a template, or creating a new folder
				if (document.getElementById("radMemberFolder_1") != null)
				{
					if (p_type=="Member") {
						var sourceOfName = $('input:radio[name=radMemberFolder]:checked').val();
						if (sourceOfName=="PeopleTemplate") {
							var selIdx = get("selectTreePeopleTemplates").selectedIndex;
							if (selIdx>0) {
								var name = get("selectTreePeopleTemplates")[selIdx].text;
								var templateId = get("selectTreePeopleTemplates")[selIdx].value;
							} else {
								$.handleErrorMsg("Please select a People Template or enter a new People Group name.");
								return false;
							}
						} else if (sourceOfName=="NewGroupName") {
							var name = document.getElementById("txtMemberGroup_Add").value;
							var templateId = "";
						} else {
							$.handleErrorMsg("Unable to determine new folder name.");
							return false;
						}
					} else {
						var sourceOfName = $('input:radio[name=radAssetFolder]:checked').val();
						if (sourceOfName=="TrainingTemplate") {
							var selIdx = get("selectTreeTrainingTemplates").selectedIndex;
							if (selIdx>0) {
								var name = get("selectTreeTrainingTemplates")[selIdx].text;
								var templateId = get("selectTreeTrainingTemplates")[selIdx].value;
							} else {
								$.handleErrorMsg("Please select a Training Template or enter a new Training Group name.");
								return false;
							}
						} else if (sourceOfName=="NewGroupName") {
							var name = document.getElementById("txtAssetGroup_Add").value;
							var templateId = "";
						} else {
							$.handleErrorMsg("Unable to determine new folder name.");
							return false;
						}
					}
				} else {
					var sourceOfName = "NewGroupName";
					if (p_type=="Member") {
						var name = document.getElementById("txtMemberGroup_Add").value;
					} else {
						var name = document.getElementById("txtAssetGroup_Add").value;
					}
					var templateId = "";
				}
				$.trVars.treeStorage = sourceOfName;
				//error checking on name to add to groupTree
				if (!$.isValidGroupName(id,name)) return false;
				if ($.isDuplicateGroupName(id,name)) return false;
				var namedType = p_type;
				//reset treeAction
				$.trVars.treeAction = "addGroup."+namedType;  //i.e. addGroup.Member, addGroup.Asset
				//Perform action
				var newid = calculateId(id); //this will be +1 off the last child under the parent
				var newObjectId = "";
				try {
					var parentId = $.trVars.tree.getUserData(id,"Id");
				} catch (errAddGroupParentIdChk) {
					$.handleErrorMsg("Unable to determine objectId, Add cancelled");
					return false;
				}

				$.trVars.treeNewId = newid;
				$.trVars.treeNewName = name;
				$.trVars.treeParentId = parentId;
				if (sourceOfName == "NewGroupName") 
				{
					//NOT a template import
						var parms = {ApplicationCustomerId: $.trVars.appCustId, 
									 ApplicationCustomerType: "\"" + $.trVars.appCustType + "\"", 
									 Context: "\"" + $.trVars.appContext + "\"" ,
									 ParentId: parentId ,
									 Type: "\"" + "Group."+namedType + "\"" ,
									 Value: "\"" + name + "\"" ,
									 NodeId: "\"" + newid + "\"" ,
									 ObjectId: 0
								   };
						if ($.trVars.debugMode=="on") {
							alert("IN $.addNamedGroup\n\n" + "parms.Value: " + parms.Value +
							   "\nparentId: " + parms.ParentId + 
								"\nType: " + parms.Type +
								"\nNodeId: " + parms.NodeId);
						}
						$.ajax({
							url: "http://" + location.host + "/Services_LMS/GroupWS.asmx/AddTreeNode",
							global: false,
							type: "POST",
							cache: false,
							data: (parms),
							dataType: "json",
							success: function(msg) {
								//debugger;
								//alert("callback msg." + msg);
								try {
									if (isNumber(msg)) {
										var newObjectId = msg;
										var groupType = $.trVars.treeAction.replace("add",""); //"addGroup.Member will become Group.Member
										var imgType = groupType.replace(".","");  			   //Group.Member will become GroupMember
										var imgStr=$.deriveNamedGroupIconHtml(groupType);
										$.trVars.tree.insertNewChild($.trVars.treeIdSelected,$.trVars.treeNewId,$.trVars.treeNewName+imgStr,0,0,0,0,"SELECT");
										$.trVars.tree.setItemImage($.trVars.treeNewId,eval("$.trVars.assetIcons."+imgType));
										$.trVars.tree.setUserData($.trVars.treeNewId,"type",groupType);
										$.trVars.tree.setUserData($.trVars.treeNewId,"parentId",$.trVars.treeParentId);
										$.trVars.tree.setUserData($.trVars.treeNewId,"Id",newObjectId);
										$.sortTree(); 
										if (imgType=="GroupMember")	toggleDiv('TraineeGroup_Add'); 
										if (imgType=="GroupAsset")	toggleDiv('AssetGroup_Add'); 
										$.trVars.tree.selectItem($.trVars.treeNewId);
										//$.unblockUI  this is in sortTree
									} else {
										$.handleErrorMsg("Add Named Group failed. msg." + msg);
									}
								} catch (errAddFolder) {
									$.handleErrorMsg("Add Named Group failed. Return Invalid. msg." + msg);
								}
							},
							error: function(msg) {
								//debugger;
								$.handleErrorMsg("Error in Add Named Group: " + msg);
							},
							complete: function() {
								// unblock when remote call returns 
								//debugger;
							}
						});
				} else {
						//THIS IS A TEMPLATE IMPORT
						$.templateVars.selectedTemplateId = templateId;
						var parms = {ApplicationCustomerId: $.trVars.appCustId, 
									 ApplicationCustomerType: "\"" + $.trVars.appCustType + "\"", 
									 Context: "\"" + $.trVars.appContext + "\"" ,
									 ParentId: parentId ,
									 Type: "\"" + "Group."+namedType + "\"" ,
									 Value: "\"" + name + "\"" ,
									 NodeId: "\"" + newid + "\"" ,
									 ObjectId: 0 , 
									 TemplateId: templateId 
								   };
						if ($.trVars.debugMode=="on") {
							
							var s2 = "parms.Value: " + parms.Value +
							   "\nparentId: " + parms.ParentId + 
								"\nType: " + parms.Type +
								"\nNodeId: " + parms.NodeId + 
								"\nTemplateId: " + parms.TemplateId;
							var s= "AddTreeNodeWithTemplateId:<br />CustId:"+$.trVars.appCustId+"<br />parms.Value: " + parms.Value +
							   "<br />parentId: " + parms.ParentId + 
								"<br />Type: " + parms.Type +
								"<br />NodeId: " + parms.NodeId + 
								"<br />TemplateId: " + parms.TemplateId + "<br /><br />";
								$("#spDebugMessage").html(s);
							if (!confirm(s2 + "\n\ncontinue?")) {
								$.unblockUI();
								return false;
							}
							
						}
						$.ajax({
							url: "http://" + location.host + "/Services_LMS/GroupWS.asmx/AddTreeNodeWithTemplateId",
							global: false,
							type: "POST",
							cache: false,
							data: (parms),
							dataType: "json",
							success: function(msg) {
								//debugger;
								//alert("IN callback from AddTreeNodeWithTemplateId\n\n" + "callback msg." + msg);
								try {
									if (isNumber(msg)) {
										var newObjectId = msg;
										var groupType = $.trVars.treeAction.replace("add",""); //"addGroup.Member will become Group.Member
										var imgType = groupType.replace(".","");  			   //Group.Member will become GroupMember
										var imgStr=$.deriveNamedGroupIconHtml(groupType);
										$.trVars.tree.insertNewChild($.trVars.treeIdSelected,$.trVars.treeNewId,$.trVars.treeNewName+imgStr,0,0,0,0,"SELECT");
										$.trVars.tree.setItemImage($.trVars.treeNewId,eval("$.trVars.assetIcons."+imgType));
										$.trVars.tree.setUserData($.trVars.treeNewId,"type",groupType);
										$.trVars.tree.setUserData($.trVars.treeNewId,"parentId",$.trVars.treeParentId);
										$.trVars.tree.setUserData($.trVars.treeNewId,"Id",newObjectId);
										$.trVars.tree.setUserData($.trVars.treeNewId,"TemplateId",$.templateVars.selectedTemplateId);
										//"PeopleTemplate" or "TrainingTemplate"
										$.importTemplateItems($.trVars.treeStorage,$.trVars.treeNewId,$.trVars.treeNewName);
										if ($.trVars.debugMode=="on") {
											$("#spDebugMessage").html($("#spDebugMessage").html()+"New Folder Id:"+$.trVars.treeNewId + "," + newObjectId + "<br /><br />");
										}
									} else {
										$.handleErrorMsg("Add Named Group failed (template). msg." + msg);
									}
								} catch (errAddFolder) {
									$.handleErrorMsg("Add Named Group failed (template import). Return Invalid. msg." + msg);
								}
							},
							error: function(msg) {
								//debugger;
								$.handleErrorMsg("Error in Add Named Group (template import): " + msg);
							},
							complete: function() {
								// unblock when remote call returns 
								//debugger;
							}
						});
				}
			}
			//----------------------------------------------------
			// Add Asset Leaf(s) to folder from selected Template
			//----------------------------------------------------
			$.importTemplateItems = function(treeStorage,selectedId,treeNewName) {
				if (treeStorage=="PeopleTemplate") {
					var selIdx = get("selectTreePeopleTemplates").selectedIndex;
					var templateId = get("selectTreePeopleTemplates")[selIdx].value;
					myGroupTemplate.type="Group.Member"
				} else if (treeStorage=="TrainingTemplate") {
					var selIdx = get("selectTreeTrainingTemplates").selectedIndex;
					var templateId = get("selectTreeTrainingTemplates")[selIdx].value;
					myGroupTemplate.type="Group.Asset"
				}	
				myGroupTemplate.templateId = templateId;
				myGroupTemplate.outputFormat="import";
				myGroupTemplate.getGroupTemplateObjectsByGroupTemplateId();
			}
			
			$.importAssetsFromTemplate = function() {
				if (myGroupTemplate.type=="Group.Member") {
					var templateArr = myGroupTemplate.groupPeopleTemplateObjects;
				} else if (myGroupTemplate.type=="Group.Asset") {
					var templateArr = myGroupTemplate.groupTrainingTemplateObjects;
			    } else {
					$.handleErrorMsg("Invalid Type, importAssetsFromTemplate");
					var templateArr = "";
				}
				$.blockUI({message:$.setWaitMsg("Adding items from template...")});
				$.trVars.treeAction = "addTemplateItems";
				var id = $.trVars.tree.getSelectedItemId();
				$.trVars.treeIdSelected = id;
				//alert("IN importAssetsFromTemplate\n" + myGroupTemplate.type + "," + templateArr.length + "\n" + "selectedNode:" + id);
				try {
					var parentId = $.trVars.tree.getUserData(id,"Id");
					$.trVars.treeRecordIdSelected = parentId;
				} catch (errAddAssetParentIdChk) {
					$.handleErrorMsg("Unable to determine parentId, Add Asset cancelled");
					return false;
				}
				//Get selected assets
				var newid = "";
				var cbxArr = templateArr;
				$.trVars.itemCheckboxes = cbxArr;
				var IdList = "";
				var assetTypeList = "";
				var newNodesList = "";
				var templateIdList = "";
				var newChildId = calculateId(id);  //this will be the first new child, +1 off the last child for the parent id
				for (kdx=0;kdx<cbxArr.length;kdx++) {
					////id,Type,ObjectId,Name,GroupId,ScheduleId 
						cbxLabel = cbxArr[kdx].Name;
						IdList += cbxArr[kdx].ObjectId + ",";
						templateIdList += cbxArr[kdx].id + ",";
						assetTypeList += cbxArr[kdx].Type + ",";
						if (newNodesList!="") newChildId = calculateSiblingId(newChildId);
						//the first newChildId is calculated above as the first new child of the parent
						//after that, each successive item is considered an adjacent sibling
						newNodesList += newChildId + ",";
				}
				if (IdList.length == 0) {
					try { $.unblockUI(); } catch (berr2) {}
					$.handleErrorMsg("There are no items in the group folder just created");
					return false;
				} else {
					//strip off ending comma
					IdList = IdList.substr(0,IdList.length-1);
					assetTypeList = assetTypeList.substr(0,assetTypeList.length-1);
					newNodesList = newNodesList.substr(0,newNodesList.length-1);
					templateIdList = templateIdList.substr(0,templateIdList.length-1);
				}
				//Perform Action
				var parms = {ApplicationCustomerId: $.trVars.appCustId, 
							 ApplicationCustomerType: "\"" + $.trVars.appCustType + "\"", 
							 Context: "\"" + $.trVars.appContext + "\"" ,
							 ParentId: parentId ,
							 TypeList: "\"" + assetTypeList + "\"" , 
							 NodeIdList: "\"" + newNodesList + "\"" , 		
							 ObjectIdList: "\"" + IdList + "\"" , //memberIds, CourseTitleIds, DocIds
							 TemplateIdList: "\"" + templateIdList + "\""  //these items TemplateIds
						   };
				$.templateVars.selectedTemplateIdsArr = templateIdList.split(",");
				if ($.trVars.debugMode=="on") {
				//spDebugMessage
					//alert(parms.ApplicationCustomerId);
					//alert(parms.ApplicationCustomerType);
					//alert(parms.Context);
					//alert(parms.ParentId);
					//alert(parms.TypeList);
					//alert(parms.NodeIdList);
					//alert(parms.ObjectIdList);
					//alert(parms.TemplateIdList);
				   var s = "AddTreeNodesWithTemplateIds<br />CustId:"+$.trVars.appCustId+"<br />ParentId:" + 
							parms.ParentId + "<br />TypeList:" + 
							assetTypeList + "<br />NodeIdList:" + 
							newNodesList + "<br />IdList:" + 
							IdList + "<br />TemplateIdList:" + 
							templateIdList ;
					var s2 = "AddTreeNodesWithTemplateIds\n\nCustId:" + $.trVars.appCustId +
							"\nParentId:" + 
							parms.ParentId + "\nTypeList:" + 
							assetTypeList + "\nNodeIdList:" + 
							newNodesList + "\nIdList:" + 
							IdList + "\ntemplateIdList:" + 
							templateIdList ;
				   $("#spDebugMessage").html($("#spDebugMessage").html()+s);
				   if (!confirm(s2 + "\n\nContinue?")) {
						$.unblockUI();
						return false;
					}
					
				}
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/GroupWS.asmx/AddTreeNodesWithTemplateIds",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
                        //debugger;
						//alert(msg);
						if ($.trVars.debugMode=="on") {
							$("#spDebugMessage").html($("#spDebugMessage").html()+"<br />Return: " + msg);
						}
						try 
						{
							if  ((msg.indexOf(":") > 0) && (msg.indexOf(".") > 0) && (msg.substr(0,6)!="error:")) 
							{
								var msgArr;
								var msgAssetArr;
								var retArr = $.trVars.itemCheckboxes;  //this should be template objects
								var msgArr = msg.split("|");
								//alert("In callback from importAssetsFromTemplate\n" + myGroupTemplate.type + ",items returned: " + + retArr.length);
								if ($.trVars.debugMode=="on") {
									$("#spDebugMessage").html($("#spDebugMessage").html()+"<br />#items sent: " + retArr.length);
									$("#spDebugMessage").html($("#spDebugMessage").html()+"<br />#items returned: " + msgArr.length);
								}
								for (addIdx=0;addIdx<retArr.length;addIdx++) {
										newid = calculateId($.trVars.treeIdSelected); //this will be +1 off the last child under the parent
										//alert("IN IMPORT CALLBACK LOOP \n" + myGroupTemplate.type + ",items returned: " + retArr.length + "\n" + newid);
										$.trVars.tree.insertNewChild($.trVars.treeIdSelected,newid,retArr[addIdx].Name,0,0,0,0);
										var thisType = retArr[addIdx].Type
										if (retArr[addIdx].Type=="member") thisType = "Member";
										if (retArr[addIdx].Type=="document") thisType = "Document";
										if (retArr[addIdx].Type=="course") thisType = "Course";
										if (retArr[addIdx].Type=="customtraining") thisType = "CustomTraining";
										$.trVars.tree.setItemImage(newid,eval("$.trVars.assetIcons." + thisType));
										$.trVars.tree.setUserData(newid,"type",thisType);
										$.trVars.tree.setUserData(newid,"parentId",$.trVars.treeRecordIdSelected);
										//$.trVars.tree.setUserData(newid,"TemplateId",$.templateVars.selectedTemplateIdsArr[addIdx]);
										msgAssetArr = "";
										for (idxAdd=0;idxAdd< msgArr.length;idxAdd++) {
											//alert(msgArr[idxAdd]);
											msgAssetArr = msgArr[idxAdd].split(":");
											//msgAssetArr[0] = recordId of new asset, msgAssetArr[1] = nodeId of new asset, msgAssetArr[2] = templateId
											if (msgAssetArr[1] == newid) {
												$.trVars.tree.setUserData(newid,"Id",msgAssetArr[0]);
												$.trVars.tree.setUserData(newid,"TemplateId",msgAssetArr[2]);
											}
										}
										if (addIdx==retArr.length-1) {
											if ($.tandemAjaxCalls.status=="inProgress") {
												$.tandemAjaxCalls.callTandemAjax();
											} else {
												$.sortTree(); 
											}
										} 												
								} 
							} else {
								$.handleErrorMsg("Add Template Assets failed. Server Msg." + msg);
							}
						} catch (errAddAssets) {
							$.handleErrorMsg("Assign Template Assets failed on the client. msg." + msg);
						}
                    },
                    error: function(msg) {
                        //debugger;
                        $.handleErrorMsg("Error in import template assets." + msg);
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;

                    }
                });			
			}
			
	//-------------------------------------------------------
	// Add Asset Leaf(s) to folder from context menu add
	//-------------------------------------------------------
			$.addAsset = function(assettype) {
			    $.trVars.treeAction = "add" + assettype;
				var id = $.trVars.tree.getSelectedItemId();
				$.trVars.treeIdSelected = id;
				$.trVars.treeAssettype = assettype;
				if (!$.isNodeSelected(id)) 
				{
					$.handleErrorMsg("Please select a folder group item first");
					return false;
				}
				var type = determineType(id);
				if ($.isLeafNode(type)) 
				{
					$.handleErrorMsg("You cannot perform this action for an individual item. Please select a folder level Group first.");
					return false;
				}
				try {
					var parentId = $.trVars.tree.getUserData(id,"Id");
					$.trVars.treeRecordIdSelected = parentId;
				} catch (errAddAssetParentIdChk) {
					$.handleErrorMsg("Unable to determine parentId, Add Asset cancelled");
					return false;
				}
				try { $.blockUI({message:$.setWaitMsg("Adding item(s) to folder...")}); } catch (berr1) {}
				//Get selected assets
				var newid = "";
				var cbxArr = document.getElementsByName("cbx"+assettype);
				$.trVars.itemCheckboxes = cbxArr;
				var IdList = "";
				var assetTypeList = "";
				var newNodesList = "";
				var newChildId = calculateId(id);  //this will be the first new child, +1 off the last child for the parent id
				for (kdx=0;kdx<cbxArr.length;kdx++) {
					if (cbxArr[kdx].checked==true) {
						cbxLabel = document.getElementById(cbxArr[kdx].id+"_lbl").innerHTML;
						if (!$.isDuplicateAsset(assettype,id,cbxLabel)) {
							IdList += cbxArr[kdx].value + ",";
							assetTypeList += assettype + ",";
							if (newNodesList!="") newChildId = calculateSiblingId(newChildId);
							//the first newChildId is calculated above as the first new child of the parent
							//after that, each successive item is considered an adjacent sibling
							newNodesList += newChildId + ",";
						} else {
							document.getElementById(cbxArr[kdx].id).checked=false;
						}
					}
				}
				if (IdList.length == 0) {
					$.handleErrorMsg("There are no items selected. Some items selected may already be in the destination folder.\n\nAdd cancelled");
					return false;
				} else {
					//strip off ending comma
					IdList = IdList.substr(0,IdList.length-1);
					assetTypeList = assetTypeList.substr(0,assetTypeList.length-1);
					newNodesList = newNodesList.substr(0,newNodesList.length-1);
				}
				//Testing:
				//if (!confirm("Perform Add action: continue?")) return false;
				
				//Perform Action
				var parms = {ApplicationCustomerId: $.trVars.appCustId, 
							 ApplicationCustomerType: "\"" + $.trVars.appCustType + "\"", 
							 Context: "\"" + $.trVars.appContext + "\"" ,
							 ParentId: parentId ,
							 TypeList: "\"" + assetTypeList + "\"" , 
							 NodeIdList: "\"" + newNodesList + "\"" , 		
							 ObjectIdList: "\"" + IdList + "\""  //memberIds, CourseTitleIds, DocIds
						   };
				if ($.trVars.debugMode=="on") {
					if (!confirm("ParentId: " + parms.ParentId + "\nTypeList:" + assetTypeList + "\nNodeIdList:" + newNodesList + "\nObjectIdList:" + IdList + "\n\nContinue?")) return false;
				}
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/GroupWS.asmx/AddTreeNodes",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
                        //debugger;
						try 
						{
							if  ((msg.indexOf(":") > 0) && (msg.indexOf(".") > 0) && (msg.substr(0,6)!="error:")) 
							{
								var msgArr;
								var msgAssetArr;
								var retArr = $.trVars.itemCheckboxes;
								for (addIdx=0;addIdx<retArr.length;addIdx++) {
									if (retArr[addIdx].checked==true) {
										newid = calculateId($.trVars.treeIdSelected); //this will be +1 off the last child under the parent
										//alert("parent: " + $.trVars.treeIdSelected + ", child: " + newid);
										labelId = retArr[addIdx].id+"_lbl";
										$.trVars.tree.insertNewChild($.trVars.treeIdSelected,newid,document.getElementById(labelId).innerHTML,0,0,0,0);
										$.trVars.tree.setItemImage(newid,eval("$.trVars.assetIcons." + $.trVars.treeAssettype));
										$.trVars.tree.setUserData(newid,"type",$.trVars.treeAssettype);
										$.trVars.tree.setUserData(newid,"parentId",$.trVars.treeRecordIdSelected);
										msgArr = msg.split("|");
										msgAssetArr = "";
										for (idxAdd=0;idxAdd< msgArr.length;idxAdd++) {
											//alert(msgArr[idxAdd]);
											msgAssetArr = msgArr[idxAdd].split(":");
											/*msgAssetArr[0] = recordId of new asset, msgAssetArr[1] = nodeId of new asset*/
											if (msgAssetArr[1] == newid) $.trVars.tree.setUserData(newid,"Id",msgAssetArr[0]);
										}
									}
									if (addIdx==retArr.length-1) {
										$.sortTree();
										//try { $.unblockUI(); } catch (berr2) {}  //this is in sortTree()
										try {
											refreshUCC();  //this is in groupTreeGetAssets.js
										} catch(eucc) {}
									}
								} 
							} else {
								$.handleErrorMsg("Add Assets failed. msg invalid format." + jQuery.parseJSON(msg));
							}
						} catch (errAddAssets) {
							$.handleErrorMsg("Add Assets failed on client. msg." + jQuery.parseJSON(msg));
						}
                    },
                    error: function(msg) {
                        //debugger;
                        $.handleErrorMsg("Error in Add Asset." + jQuery.parseJSON(msg));
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;

                    }
                });
			}
			
	//-------------------------------------------
	// Copy Part 1 - select items to move
	//-------------------------------------------
			$.copySelect = function() {
				$.trVars.treeAction = "copy";
				if (document.getElementById("divasset_copy").style.display=="none") {
					return false; //get out
				}
				var id = $.trVars.tree.getSelectedItemId();
				var IdList = "";
				var idType = determineType(id);
				//Error checking
				if (id==null || id=="") {
					$.handleErrorMsg("Please select an item to copy");
					return false;
				} else if (id == $.trVars.rootFolderId) {
					$.handleErrorMsg("You cannot copy the root element");
					return false;
				}
				$.trVars.treeIdSelected = "";
				$.trVars.treeFolderTypeSelected = "";
				$.trVars.treeMoveIdList = "";
				$.trVars.treeStorage = "";
				var subItems = $.trVars.tree.getSubItems(id);
				//TODO: selected tree items (checkboxes)
				/*if there are children, give user the choice to move children only or entire folder*/
				if ((subItems.length > 0) && ($.isGroupLevelNode(idType))) {
					document.getElementById("divasset_copyGroupQuestion").style.display = "block";
					subItems = $.trVars.tree.getAllSubItems(id);
					IdList = subItems;
				} else {
					/*copy individual item that has no children (folder or leaf) */
					IdList = id;
				}
				/*store step-1 options*/
				$.trVars.treeMoveIdList = IdList;
				$.trVars.treeIdSelected = id;
				$.trVars.treeRecordIdSelected = $.getUserData(id,"Id");
				$.trVars.treeFolderTypeSelected = idType;
			}
			$.copyCancel = function() {
				$.trVars.treeAction = "";
				$.trVars.tree.selectItem($.trVars.treeIdSelected);
				toggleDiv("");
				if ($.trVars.treeStorage.length>0) {
					var thisArr = $.trVars.treeStorage.split(",");
							$.each(thisArr, function(idx, val) {  
								$.trVars.tree.deleteItem(val,false);
							});
				};
			}
			
	//-------------------------------------------
	// Copy Part 2 - add to destination folder
	//-------------------------------------------
			$.copyPaste = function() {
				var id = $.trVars.tree.getSelectedItemId();
				var parentId = $.getUserData(id,"Id");
				var IdList = "";
				var recordIdList = ""
				var idType = determineType(id);
				//Error checking
				if (id==null || id=="") {
					$.handleErrorMsg("Please select a destination folder");
					$.copyCancel();
					return false;
				} 
				if ($.isLeafNode(idType)) {
					$.handleErrorMsg("You cannot copy to a single item. Please select a destination folder.");
					$.copyCancel();
					return false;
				}
				if (id == $.trVars.treeIdSelected) {
					$.handleErrorMsg("Destination folder is the same as copy folder.");
					$.copyCancel();
					return false;
				}

				try { $.blockUI({message:$.setWaitMsg("Copying selected items...")}); } catch (berr1) {}
				$.trVars.treeStorage="";
				//check for valid types being pasted to Named Group Folder
				if (idType=="Group.Member" || idType=="Group.Asset") {
					if (!$.validateNamedGroupDrop($.trVars.treeMoveIdList,idType)) {
						if (idType=="Group.Member") {
							$.handleErrorMsg("Only members are allowed in this Named Group folder. Action cancelled.");
						} else if (idType=="Group.Asset") {
							$.handleErrorMsg("Only courses and documents are allowed in this Named Group folder. Action cancelled.");
						}
						if ($.trVars.treeAction=="copy") {
							$.copyCancel();
						} else if ($.trVars.treeAction=="move") {
							$.moveItemsCancel();
						}
						try { $.unblockUI(); } catch (berr1a) {}
						return false;
					}
				}
				
				//check for duplicates in the destination folder
				var copyType = "";
				if ($.isGroupLevelNode($.trVars.treeFolderTypeSelected)) {
					//if the thing being copied is a group, check its contents
					if (document.getElementById("radCopyFolderAll").checked==true) {
						var copyName = $.trVars.tree.getItemText($.trVars.treeIdSelected);
						if ($.isDuplicateGroupName(id,copyName)) {
							$.copyCancel();
							try { $.unblockUI(); } catch (berrb1) {}
							return false;
						}
						IdList = $.trVars.treeIdSelected + "," + $.trVars.treeMoveIdList;
										//TESTING:
										/*
							if (!confirm("IdList:" + IdList + "\n\ncontinue?")) {
								try { $.unblockUI(); } catch (berr1test) {}
								return false;
							}
							*/
						//get RecordIds from userData
						var IdListArr = IdList.split(",");
						for (idx=0;idx<IdListArr.length;idx++) {
							try {
								recordIdList += $.getUserData(IdListArr[idx],"Id") + ",";
							} catch(cpyErr1) {
								$.handleErrorMsg("Error ocurred in Copy/Paste. Unable to retrieve userData values.");
								$.copyCancel();
								return false;
							}
						}
						copyType = "all";
					} else if (document.getElementById("radCopyFolderContents").checked==true) {
							IdList = "";
							var duplicatesFound = false;
							array_IdList = $.trVars.treeMoveIdList.split(",");
							//re-construct the list with non-duplicated items
							$.each(array_IdList, function(idx, val) {  
								copyName = $.trVars.tree.getItemText(val);
								copyType = determineType(val);
								if (!$.isDuplicateAsset(copyType,id,copyName)) {
									IdList += val + ",";
									recordIdList += $.getUserData(val,"Id") + ",";
								} else { duplicatesFound = true;}
							});
							if (IdList.length > 0) {
								IdList = removeEndingComma(IdList);   
								copyType = "items";
								if (duplicatesFound) alert("Duplicated items were NOT copied.");
							} else {
								alert("The selected items already exist in the destination folder");
								$.copyCancel();
								try { $.unblockUI(); } catch (berr1d) {}
								return false;	
							}
					}
				} else {
					var copyName = $.trVars.tree.getItemText($.trVars.treeIdSelected);
					var copyType = determineType($.trVars.treeIdSelected);
					if ($.isDuplicateAsset(copyType,id,copyName)) {
						$.handleErrorMsg("This item already exists in the destination folder.");
						$.copyCancel();
						return false;
					}
					IdList = $.trVars.treeIdSelected;
					recordIdList = $.getUserData($.trVars.treeIdSelected,"Id");
					copyType = "item";
				}
								

				var newNodeIdList = "";
				//Perform action
				var assettype;
				//alert("Nodes begin copied: " + IdList);
				if (copyType == "all") {
					//insert Groupfolder
					newid = calculateId(id); //this will be +1 off the last child under the parent
					newNodeIdList = newid + ",";
					var idMvArr = IdList.split(",");
					assettype = determineType(idMvArr[0]);
					$.trVars.tree.insertNewChild(id,newid,$.trVars.tree.getItemText(idMvArr[0]),0,0,0,0);
					$.trVars.tree.setItemImage(newid,eval("$.trVars.assetIcons." + assettype.replace(".","")));
					$.trVars.tree.setUserData(newid,"type",assettype);
					var copiedNodeBase = idMvArr[0];
					//alert("base of " + copiedNodeBase);
					//alert("copied node: " + idMvArr[0] + ", becomes:" + newid);
					for (iMvIdx = 1;iMvIdx<idMvArr.length;iMvIdx++) {
							//add each item underneath the new parentNode
							//newchildid = calculateId(newid); //this will be +1 off the last child under the parent
							newchildid = idMvArr[iMvIdx].replace(copiedNodeBase,newid);
							//alert("copied node: " + idMvArr[iMvIdx] + ", becomes:" + newchildid + "\nunder parentId: " + newchildid.substr(0,newchildid.lastIndexOf(".")));
							newNodeIdList += newchildid + ",";
							assettype = determineType(idMvArr[iMvIdx]);
							$.trVars.tree.insertNewChild(newchildid.substr(0,newchildid.lastIndexOf(".")),newchildid,$.trVars.tree.getItemText(idMvArr[iMvIdx]),0,0,0,0);
							$.trVars.tree.setItemImage(newchildid,eval("$.trVars.assetIcons." + assettype.replace(".","")));
							$.trVars.tree.setUserData(newchildid,"type",assettype);
					}
				} else if (copyType == "item") {
					newid = calculateId(id); //this will be +1 off the last child under the parent
					newNodeIdList = newid;
					assettype = determineType(IdList);
					$.trVars.tree.insertNewChild(id,newid,$.trVars.tree.getItemText(IdList),0,0,0,0);
					$.trVars.tree.setItemImage(newid,eval("$.trVars.assetIcons." + assettype.replace(".","")));
					$.trVars.tree.setUserData(newid,"type",assettype);
				} else if (copyType == "items") {
					var idMvArr = IdList.split(",");
					var newNode = calculateId(id);  //this will be +1 off the last child under the parent
					//add the first item in the list as the next child under id
					//alert("copied node: " + idMvArr[0] + ", becomes:" + newNode + "\nunder parentId: " + newNode.substr(0,newNode.lastIndexOf(".")));
					assettype = determineType(idMvArr[0]);
					newNodeIdList += newNode + ",";
					$.trVars.tree.insertNewChild(newNode.substr(0,newNode.lastIndexOf(".")),newNode,$.trVars.tree.getItemText(idMvArr[0]),0,0,0,0);
					$.trVars.tree.setItemImage(newNode,eval("$.trVars.assetIcons." + assettype.replace(".","")));
					$.trVars.tree.setUserData(newNode,"type",assettype);
					//set up this newly create node as the basis for the loop
					var Lvl = $.trVars.tree.getLevel(idMvArr[0]); 
					var Node = newNode
					for (iMvIdx=1; iMvIdx<idMvArr.length; iMvIdx++) {
						   //add each item underneath the new parent node
							thisLvl = $.trVars.tree.getLevel(idMvArr[iMvIdx]);
							if (thisLvl > Lvl) {
								//the level just indented right, so this is a first child
								newNode = Node + ".1";
							} else if (thisLvl == Lvl ) {
								newNode = calculateSiblingId(Node);
							} else	{
								//the indentation shifted left (< previous level)
								chararr = Node.split(".");
								//ex: 1.4.3.2, the parents will be 1 or 1.4 or 1.4.3 
								s = "";
								//get the first n=thisLvl number of digits in the Node
								//ex: previous level=4, node = 1.4.3.2
								//    this level = 2, the indentation is twice in, 
								//    so the parent would be the first 2 digits in the previous node, thus 1.4 is the parent.
								//    This node's id would be the parent's sibling = 1.5
								//    (4) 1.4.3.2
								//    (2) 1.5
								for (jj=0;jj<parseInt(thisLvl);jj++) {
									s = s + chararr[jj];
									if (jj < parseInt(thisLvl)-1) s = s+".";
								}
								newNode = calculateSiblingId(s);
							}
							Lvl = thisLvl;
							Node = newNode;	
							//newid = idMvArr[iMvIdx].replace(copiedNodeBase,id);  //id is the parent
							//alert("copied node: " + idMvArr[iMvIdx] + ", becomes:" + newNode + "\nunder parentId: " + newNode.substr(0,newNode.lastIndexOf(".")));
							assettype = determineType(idMvArr[iMvIdx]);
							newNodeIdList += newNode + ",";
							$.trVars.tree.insertNewChild(newNode.substr(0,newNode.lastIndexOf(".")),newNode,$.trVars.tree.getItemText(idMvArr[iMvIdx]),0,0,0,0);
							$.trVars.tree.setItemImage(newNode,eval("$.trVars.assetIcons." + assettype.replace(".","")));
							$.trVars.tree.setUserData(newNode,"type",assettype);
					}
				} 
					
					parms = {"IdList": "\"" + removeEndingComma(recordIdList) + "\"", 
							 "NodeIdList": "\"" + removeEndingComma(newNodeIdList) + "\"",
							 "ParentId": parentId
					}
					$.trVars.treeStorage=newNodeIdList;  //store it so we can delete them if there is an error
					//Testing: Debug 
					//if (!confirm("IdList:" + removeEndingComma(recordIdList) + "\nNodeIdList:" + removeEndingComma(newNodeIdList) + "\nParentId:" + parentId)) return false;
					$.ajax({
							url: "http://" + location.host + "/Services_LMS/GroupWS.asmx/CopyTreeNode",
							global: false,
							type: "POST",
							cache: false,
							data: (parms),
							dataType: "json",
							success: function(msg) {
								//debugger;
								//alert("msg." + msg);
								try {
									//msg: "399:1.8.1|400:1.8.2|401:1.8.3"
									if  ((msg.indexOf(":") > 0) && (msg.indexOf(".") > 0) && (msg.substr(0,6)!="error:")) 
									{
										var msgArr = msg.split("|");
										var msgAssetArr = "";
										for (idxId=0;idxId< msgArr.length;idxId++) {
											msgAssetArr = msgArr[idxId].split(":");
											//msgAssetArr[0] = recordId of new asset, msgAssetArr[1] = parentId of new asset
											$.trVars.tree.setUserData(msgAssetArr[1],"Id",msgAssetArr[0]);
											$.trVars.tree.setUserData(msgAssetArr[1],"parentId",$.getUserData(getParentNodeId(msgAssetArr[1]),"parentId"));
											if (idxId == msgArr.length-1) {
												$.sortTree();
												//try { $.unblockUI(); } catch (berr2) {}  //this is in sortTree
												try {
													refreshUCC();  //this is in groupTreeGetAssets.js
												} catch(eucc) {}
											}
										}
									} else {
										$.handleErrorMsg("Copy failed. msg." + msg);
										$.copyCancel();
									}
								} catch (errCopy) {
									$.handleErrorMsg("Copy failed. msg." + msg);
									$.copyCancel();
								}
							},
							error: function(msg) {
								//debugger;
								$.handleErrorMsg("Error in Copy." + msg);
								$.copyCancel();
							},
							complete: function() {
								// unblock when remote call returns 
								//debugger;
							}
					});
				toggleDiv("");
			}
					
	//
	//-------------------------------------------
	// Delete Node
	//-------------------------------------------
			$.deleteNode = function() {
				$.trVars.treeAction = "delete";
				var id = $.trVars.tree.getSelectedItemId();
				$.trVars.treeIdSelected = id;
				var IdList = "";
				if (!$.isNodeSelected(id)) 
				{
					$.handleErrorMsg("Please select an item to delete");
					return false;
				}
				if ($.isRootNode(id))
				{
					$.handleErrorMsg("You cannot delete the root folder Group.");
					return false;
				}
				//Delete Confirmation
				//TODO: enable multiple Ids, multiple select
				var subItems = $.trVars.tree.getSubItems(id);
				$.trVars.treeSubItems = subItems;  //store for use in callback
				if (subItems.length > 0) {
					if (confirm("There are items in this group. Do you want to delete all items in this group?")==true) {
						var subItems = $.trVars.tree.getAllSubItems(id);
						IdList = subItems;
					} else {
						$.handleErrorMsg("Delete action cancelled for the selected folder");
						return false;
					}
				} else if (confirm("Are you sure you want to delete this item?")==true) {
						IdList = id;
				} else {
					$.handleErrorMsg("Delete action cancelled for the selected item");
					return false;
				}
				try { $.blockUI({message:$.setWaitMsg("Deleting item from folder...")}); } catch (derr1) {}
				//Perform action
				try {
					var objId = $.trVars.tree.getUserData(id,"Id");
				} catch (errDeleteObjIdChk) {
					$.handleErrorMsg("Unable to determine objectId, Delete cancelled");
					return false;
				}
				var parms = {Id: objId };
				//if (!confirm("Id:" + parms.Id + "\n\nContinue?")) return false;
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/GroupWS.asmx/DeleteTreeNode",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
                        //debugger;
                       //alert("msg." + msg);
						try {
							if (msg != "success") {
								$.handleErrorMsg("Delete failed. msg." + msg);
							} else {
								if ($.trVars.treeSubItems.length > 0) {
									$.trVars.tree.deleteChildItems($.trVars.treeIdSelected);
								} 
								$.trVars.tree.deleteItem($.trVars.treeIdSelected,true);
								if ($.tandemAjaxCalls.status=="inProgress") {
									$.tandemAjaxCalls.callTandemAjax();
								} else {
									$.sortTree();
									try { $.unblockUI(); } catch (derr22) {}  //this is in sortTree
									toggleDiv(''); 
								}
							}
						} catch (errDelete) {
							$.handleErrorMsg("Delete failed. Return Invalid. msg." + msg);
						}
                    },
                    error: function(msg) {
                        //debugger;
                        $.handleErrorMsg("Error in Delete." + msg);
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;
                    }
                });
			}
			
	//-------------------------------------------
	// Move Part 1 - select items to move
	//-------------------------------------------
			$.moveItems = function() {
					$.trVars.treeAction = "move";
					if (document.getElementById("divasset_move").style.display=="none") {
						return false; //get out if user clicking on move to toggle this div closed
					}
					var id = $.trVars.tree.getSelectedItemId();
					var IdList = "";
					var idType = determineType(id);
					//Error checking
					if (!$.isNodeSelected(id)) 
					{
						$.handleErrorMsg("Please select an item to move");
						return false;
					}
					if ($.isRootNode(id))
					{
						$.handleErrorMsg("You cannot move the root folder Group.");
						return false;
					}
					$.trVars.treeIdSelected = "";
					$.trVars.treeFolderTypeSelected = "";
					$.trVars.treeMoveIdList = "";
				    $.trVars.treeStorage = "";
					var subItems = $.trVars.tree.getSubItems(id);
					//TODO: multi-select from checkboxes in tree
					//if there are children, give the user the choice to move children only or entire folder
					if ((subItems.length > 0) && (idType == "Group")) {
						document.getElementById("divasset_moveGroupQuestion").style.display = "block";
						subItems = $.trVars.tree.getAllSubItems(id);
						IdList = subItems;
					} else {
						//move individual item that has no children (folder or leaf)
						IdList = id;
					}
					//store step-1 options
					$.trVars.treeMoveIdList = IdList;
					$.trVars.treeIdSelected = id;
					$.trVars.treeFolderTypeSelected = idType;
					$.trVars.tree.doCut();
			}
			$.moveItemsCancel = function() {
					$.trVars.treeAction = "";
					$.trVars.tree.clearCut();
					$.trVars.tree.selectItem($.trVars.treeIdSelected);
					toggleDiv("");
					if ($.trVars.treeStorage.length>0) {
						var thisArr = $.trVars.treeStorage.split(",");
								$.each(thisArr, function(idx, val) {  
									$.trVars.tree.deleteItem(val,false);
								});
					};
			}
	
	//-------------------------------------------
	// Move Part 2 - Drop on destination folder
	//-------------------------------------------
			$.moveItemsDrop = function() {
					var id = $.trVars.tree.getSelectedItemId();
					var IdList = "";
					var idType = determineType(id);
					//Error checking
					if (!$.isNodeSelected(id)) 
					{
						$.handleErrorMsg("Please select a destination folder");
						$.moveItemsCancel();
						return false;
					}
					if ($.isLeafNode(idType)) 
					{
						$.handleErrorMsg("You cannot move to a single item. Please select a destination folder.");
						$.moveItemsCancel();
						return false;
					}
					if (id == $.trVars.treeIdSelected) {
						$.handleErrorMsg("Destination folder is the same as move folder.");
						$.moveItemsCancel();
						return false;
					}
					//If the destination id+. is contained in the original id, then they are
					//trying to move a parent folder to a child folder. Ex: 1.3.11. is contained in 1.3.11.1
					if (!$.isLeafNode(determineType($.trVars.treeIdSelected))) {
						if (id.indexOf($.trVars.treeIdSelected+'.')==0)
						{
							$.handleErrorMsg("Moving a parent folder to a child folder is not allowed.");
							$.moveItemsCancel();
							return false;
						}
					}
					
					try { $.blockUI({message:$.setWaitMsg("Moving selected item(s)...")}); } catch (berr1a) {}
				    $.trVars.treeStorage = "";
					//check for valid types being dropped to Named Group Folder
					if (idType=="Group.Member" || idType=="Group.Asset") {
						if (!$.validateNamedGroupDrop($.trVars.treeMoveIdList,idType)) {
							if (idType=="Group.Member") {
								alert("Only members are allowed in this Named Group folder. Action cancelled.");
							} else if (idType=="Group.Asset") {
								alert("Only courses and documents are allowed in this Named Group folder. Action cancelled.");
							}
							if ($.trVars.treeAction=="copy") {
								$.copyCancel();
							} else if ($.trVars.treeAction=="move") {
								$.moveItemsCancel();
							}
							try { $.unblockUI(); } catch (berr1b) {}
							return false;
						}
					}
				
					//Check for duplicates in the destination
					var moveType = "";
					if ($.isGroupLevelNode($.trVars.treeFolderTypeSelected)) {
						if (document.getElementById("radMoveFolderAll").checked==true) {
							var movedName = $.trVars.tree.getItemText($.trVars.treeIdSelected);
							if ($.isDuplicateGroupName(id,movedName)) {
								$.moveItemsCancel();
								try { $.unblockUI(); } catch (berr1c) {}
								return false;
							}
							IdList = $.trVars.treeIdSelected + "," + $.trVars.treeMoveIdList;
							moveType = "all";
						} else if (document.getElementById("radMoveFolderContents").checked==true) {
							IdList = "";
							var duplicatesFound = false;
							array_IdList = $.trVars.treeMoveIdList.split(",");
							//re-construct the list with non-duplicate items
							$.each(array_IdList, function(idx, val) {  
								movedName = $.trVars.tree.getItemText(val);
								movedType = determineType(val);
								if (!$.isDuplicateAsset(movedType,id,movedName)) {
									IdList += val + ",";
								} else { duplicatesFound = true;}
							});
							if (IdList.length > 0) {
								IdList = removeEndingComma(IdList);   
								moveType = "items";
								if (duplicatesFound) alert("Duplicated items were NOT moved. \n\nPlease check originating folder and delete if needed.");
							} else {
								alert("The selected items already exist in the destination folder");
								$.moveItemsCancel();
								try { $.unblockUI(); } catch (berr1d) {}
								return false;	
							}
						}
					} else {
						var movedName = $.trVars.tree.getItemText($.trVars.treeIdSelected);
						var movedType = determineType($.trVars.treeIdSelected);
						if ($.isDuplicateAsset(movedType,id,movedName)) { 
							$.handleErrorMsg("This item already exists in the destination folder. Move cancelled");
							$.moveItemsCancel();
							return false;
						}
						IdList = $.trVars.treeIdSelected;
						moveType = "item";
					}
					//Perform action
					//alert("Moving these ids: " + IdList);
	
					//tree action here
					if ((moveType == "all") || (moveType == "item")){
						$.trVars.tree.moveItem($.trVars.treeIdSelected,"item_child",id);
					} else if (moveType == "items") {
						var idMvArr = IdList.split(",");
						for (iMvIdx = 0;iMvIdx<idMvArr.length;iMvIdx++) {
							$.trVars.tree.moveItem(idMvArr[iMvIdx],"item_child",id);
						}
					} 
					$.trVars.tree.clearCut();
		
					//Renumber effected Nodes
					var nodeDiffs = recalculateNodes();
					if ((nodeDiffs == "|") || (nodeDiffs == "0")) {
						//no change
						try { $.unblockUI(); } catch (berr1f) {}
						return true;
					}
					var nodeDiffsArr 	= nodeDiffs.split("|");
					//remove ending commas
					var afterNodesList = removeEndingComma(nodeDiffsArr[1]);
					var beforeNodesList = removeEndingComma(nodeDiffsArr[0]);
					//arrays
					var IdListArr = IdList.split(",");
					var beforeNodesArr	= beforeNodesList.split(",");
					var afterNodesArr = afterNodesList.split(",");
					//construct before list of recordId values and after list of new tree NodeId values
					var beforeIdList = "";
					var afterNodeIdList = "";
					for (j=0;j<beforeNodesArr.length;j++) {
						for (k=0;k<IdListArr.length;k++) {
							//we only want to send the ones that were effected by this move action
							if (beforeNodesArr[j] == IdListArr[k]) {
								try {
									beforeIdList += $.trVars.tree.getUserData(beforeNodesArr[j],"Id") + ",";
									afterNodeIdList += afterNodesArr[j] + ",";
								} catch (errMoveNodesObjId) {
									$.handleErrorMsg("Unable to determine node ids for move action, database not updated");
									return false;
								}
							}
						}
					}
					beforeIdList = removeEndingComma(beforeIdList);
					afterNodeIdList = removeEndingComma(afterNodeIdList);

				parms = {"IdList": "\"" +  beforeIdList + "\"","NodeIdList":"\"" +  afterNodeIdList + "\"" 
						};
				//if (!confirm("before:" + parms.IdList + "\nafter:" + parms.NodeIdList)) return false;
				$.trVars.treeStorage=afterNodeIdList;  //store it so we can delete them if there is an error
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/GroupWS.asmx/MoveTreeNodes",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
                        ////debugger;
                        //alert("msg." + msg);
						$.sortTree();
						//try { $.unblockUI(); } catch (berr2) {}  //this is in sortTree
						try {
							refreshUCC();  //this is in groupTreeGetAssets.js
						} catch(eucc) {}
                    },
                    error: function(msg) {
                        ////debugger;
                        $.handleErrorMsg("Error in Move." + msg);
						$.moveItemsCancel();
						$.blockUI();
						$.sortTree();
						//try { $.unblockUI(); } catch (berr2) {}  //this is in sortTree
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        ////debugger;
                    }
                });
				toggleDiv("");
			}

	
	//
	//-------------------------------------------
	// Rename Group Folder
	//-------------------------------------------
			$.renameGroup = function() {
				$.trVars.treeAction = "rename";
				var id = $.trVars.tree.getSelectedItemId();
				$.trVars.treeIdSelected = id;
				var name = document.getElementById("txtGroup_Rename").value;
				if (!$.isNodeSelected(id)) 
				{
					$.handleErrorMsg("Please select a folder group item first");
					return false;
				}
				var type = determineType(id);
				if ($.isLeafNode(type)) 
				{
					$.handleErrorMsg("You cannot perform this action for an individual item. Please select a folder level Group first.");
					return false;
				}
				if ($.isRootNode(id))
				{
					$.handleErrorMsg("You cannot rename the root folder Group.");
					return false;
				}
				if (!$.isValidGroupName(id,name)) return false;
				var parentNodeId = id.substr(0,id.lastIndexOf("."));
				//if this is a named group there will be html in the name
				if ($.isDuplicateGroupName(parentNodeId,name+$.deriveNamedGroupIconHtml(type))) return false;
				
				//Perform action
				try {
					var objId = $.trVars.tree.getUserData(id,"Id");
				} catch (errRenameObjIdChk) {
					$.handleErrorMsg("Unable to determine objectId, Rename cancelled");
					return false;
				}
				var parms = {ApplicationCustomerId: $.trVars.appCustId, 
							 ApplicationCustomerType: "\"" + $.trVars.appCustType + "\"", 
							 Context: "\"" + $.trVars.appContext + "\"" ,
							 Id: objId  ,
							 Value: "\"" + name + "\"" 
						   };
				//alert("CustId:" + $.trVars.appCustId + ", CustType:" + $.trVars.appCustType + ", Context:" + $.trVars.appContext + "\n" + "Id:" + objId + ", Name:" + name);
                $.blockUI({message:$.setWaitMsg("Renaming folder...")});
				$.ajax({
                    url: "http://" + location.host + "/Services_LMS/GroupWS.asmx/UpdateGroupName",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
                        //debugger;
                        //alert("msg." + msg);
						try {
							if (msg != "success") {
								$.handleErrorMsg("Rename Group failed. msg." + msg);
							} else {
								var imgStr = $.deriveNamedGroupIconHtml($.getUserData($.trVars.treeIdSelected,"type"));
								$.trVars.tree.setItemText($.trVars.treeIdSelected,name+imgStr);
								$.trVars.tree.selectItem($.trVars.rootFolderId);
								$.sortTree();
								toggleDiv('Group_Rename'); 
							}
						} catch (errRenameGroup) {
							$.handleErrorMsg("Rename Group failed. Return Invalid. msg." + msg);
						}
                    },
                    error: function(msg) {
                        //debugger;
                        $.handleErrorMsg("Error in Rename Group." + msg);
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;
                    }
                });
			}
			
	//----------------------------------------
	// Schedule Training
	//----------------------------------------	
			$.getCycle = function() {
				var item = $('input:radio[name=radRecur]:checked').val();
				if (($.tandemAjaxCalls.note=="wizard") && ($.tandemAjaxCalls.status=="inProgress") ) {
					item=$.templateVars.selected_cycle;
				}
				return item;
			}
			$.getQuarterSelection = function() {
				var item = $('input:radio[name=radRecurQtr]:checked').val();
				if (($.tandemAjaxCalls.note=="wizard") && ($.tandemAjaxCalls.status=="inProgress") ) {
					item=$.templateVars.selected_quarterSelection;
				}
				return item;
			}
			$.getQuarterly = function() {
				var item = "";
				if (document.getElementById("radRecurQtrly").checked==true) item = document.getElementById("radRecurQtrly").value;
				if (($.tandemAjaxCalls.note=="wizard") && ($.tandemAjaxCalls.status=="inProgress") ) {
					item=$.templateVars.selected_quarterly;
				}
				return item;
			}
			$.getCycledate = function() {
				var item = trimspaces($("#txtRecurDate").val());
				if (($.tandemAjaxCalls.note=="wizard") && ($.tandemAjaxCalls.status=="inProgress") ) {
					item=$.templateVars.selected_cycledate;
				}
				return item;
			}
			$.getCurrentScheduleDate = function() {
				var item = trimspaces($("#txtDueDate").val());
				if (($.tandemAjaxCalls.note=="wizard") && ($.tandemAjaxCalls.status=="inProgress") ) {
					item=$.templateVars.selected_currentScheduleDate;
				}
				return item;
			}
			$.scheduleTraining = function() {
			    $.trVars.treeAction = "schedule";
				var id = $.trVars.tree.getSelectedItemId();
				$.trVars.treeIdSelected = id;
				var cycle = $.getCycle();				
				var quarterSelection = $.getQuarterSelection();
				var quarterly = $.getQuarterly();
				var cycledate = $.getCycledate();
				var currentScheduleDate = $.getCurrentScheduleDate();
				//edit Due Date
				if (currentScheduleDate.length==0) {
					$.handleErrorMsg("Due Date is required");
					document.getElementById("txtDueDate").focus();
					var today = new Date(); 
					$("#txtDueDate").val(today.defaultView());
					return false;
				} else if (!isDate(currentScheduleDate)) {
					$.handleErrorMsg("Invalid Due Date format. Valid format is mm/dd/yyyy");
					document.getElementById("txtDueDate").focus();
					return false;
				}
				//edit radios
				if ((cycle=="q1" || cycle=="q2" || cycle=="q3" || cycle=="q4") && quarterly == "")
				{
					cycle += "_" + quarterSelection;
					cycledate = currentScheduleDate;
				}
				else if(quarterly == "quarterly")
				{
					cycle = quarterly;
					cycledate = currentScheduleDate;
					//$('#radRecur')[0].options.length = 0;  //already done in onclick operations
					//$('#radRecurQtr')[0].options.length = 0;

				}
				if ((cycle=="onetime")||(cycle=="NA")||(cycle=="na")||(cycle=="annuallycompleted")||(cycle=="semiannual")) cycledate = currentScheduleDate;
				if (cycledate.length==0) {
					$.handleErrorMsg("Recurring due date is required");
					document.getElementById("txtRecurDate").disabled = false;
					document.getElementById("txtRecurDate").focus();
					return false;
				} else if (!isDate(cycledate)) {
					$.handleErrorMsg("Invalid recurring due date format. Valid format is mm/dd/yyyy");
					document.getElementById("txtRecurDate").disabled = false;
					document.getElementById("txtRecurDate").focus();
					return false;
				}
				$.blockUI({message:$.setWaitMsg("Setting Scheduling options...")});
				var parms = {ApplicationCustomerId: $.trVars.appCustId, 
							 ApplicationCustomerType: "\"" + $.trVars.appCustType + "\"", 
							 Context: "\"" + $.trVars.appContext + "\"" ,
							 Id: $.getUserData(id,"Id") ,
							 Cycle: "\"" + cycle + "\"" ,
							 CycleDate: "\"" + cycledate + "\"" ,
							 "CurrentScheduleDate": "\"" + currentScheduleDate + "\""
						   };
				if ($.trVars.debugMode=="on") {
					//alert(cycle + ",\n" + quarterSelection + ",\n" + quarterly + ",\n" + cycledate + ",\n" + currentScheduleDate);
					if (!confirm("SET SCHEDULE:\n\n" + 
					"ApplicationCustomerId:" +$.trVars.appCustId + 
					"\nApplicationCustomerType:" + $.trVars.appCustType + 
					"\nContext:" + $.trVars.appContext +
								"\nId:" + $.getUserData(id,"Id")  + "\nCycle:" + cycle + "\nCycleDate:" + cycledate + "\nCurrent ScheduleDate:" + currentScheduleDate + "\n\nContinue?")) return false;;
                }
				$.ajax({
                    url: "http://" + location.host + "/Services_LMS/GroupWS.asmx/SetScheduleOnNodeForRecurrentTraining",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
                       //debugger;
                       //alert("callback msg." + msg);
						try {
							if (msg == "0") {
								$.handleErrorMsg("Schedule Training failed. msg." + msg);
							} else {	
								$.handleInfoMsg("Schedule Has Been Updated");
								toggleDiv(''); 
								if ($.tandemAjaxCalls.status=="inProgress") {
									$.tandemAjaxCalls.callTandemAjax();
								} else {
									$.unblockUI();
								}
							}
						} catch (errSchedule) {
							$.handleErrorMsg("Schedule Training. Return Invalid. msg." + jQuery.parseJSON(msg));
						}
                    },
                    error: function(msg) {
                        //debugger;
                        $.handleErrorMsg("Error in Set Schedule." + jQuery.parseJSON(msg));
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;
                    }
                });
			}
			//----------------------------------
			// Remove Schedule
			//----------------------------------
			$.scheduleRemove = function() {
				$.trVars.treeAction = "removeSchedule";
				var id = $.trVars.tree.getSelectedItemId();
				$.trVars.treeIdSelected = id;
				var deleteAll = false;
				var confirmationMsg = "Are you sure you wish to remove the schedule from this node\nand remove this node's " +
								"application to any child nodes?\n\nSchedules set on any child folder or item will be retained.";
				if (document.getElementById("radScheduleDelete_all").checked==true) {
					deleteAll = true;
					confirmationMsg = "Are you sure you wish to remove the schedule from this node\nand remove " +
									"all schedules from all child nodes under it?";
				}
				var parms = {"Id":parseInt($.trVars.tree.getUserData(id,"Id")),
							"DeleteAllSchedules":deleteAll};
				if (confirm(confirmationMsg)) {
						//alert(parms.Id + "," + parms.DeleteAllSchedules);
						$.ajax({
							url: "http://" + location.host + "/Services_LMS/GroupWs.asmx/DeleteScheduleByTreeNodeId",
							global: false,
							type: "POST",
							cache: false,
							data: (parms),
							dataType: "json",
							success: function(msg) {
								//alert("msg:\n\n" + msg);
								try {
									if (msg=="success") {
										$.handleInfoMsg("Schedule(s) have been removed");
										toggleDiv('');
									} else {
										$.handleErrorMsg("Invalid return: " + jQuery.parseJSON(msg));
									}
								} catch (loadErr) {
									//alert("loading schedule failed");
								}
							},
							error: function(msg) {
								//debugger;
								$.handleErrorMsg("Error delete schedule." + jQuery.parseJSON(msg));
							},
							complete: function() {
								// unblock when remote call returns 
								//debugger;
							}
						});
				}
			};
			
			$.SetRecurDateTextBox = function(currentScheduleDate){
					var cDate = new Date(currentScheduleDate);	
					var sDate = new Date((cDate.getMonth()+1).toString() +"/"+ cDate.getDate().toString() +"/"+ (parseInt(cDate.getFullYear())+1).toString());
					$("#txtRecurDate").datepicker( "setDate" , sDate );
			};
			
			$.ClearRadioBox = function(objName){
				var inputs = document.getElementsByTagName('INPUT');
				for (var i = 0; i < inputs.length; i++) {
					if ((inputs[i].type=="radio") && (inputs[i].name==objName)) {
						if (inputs[i].checked) inputs[i].checked = false;
					}
				}
			};
			
			$.resetRadioOptions = function(recurDate) {
			//$.resetRadioOptions(document.getElementById('txtRecurDate'))
				try {
					recurDate.disabled='disabled';  //disable the deselected annually recurring date
					document.getElementById('radRecurQtrly').checked = false;  //turn off the checkbox
					//if a Q1-4 radio is checked and the Use 1st/last radio is NOT checked, check the Use 1st
					$.lookAtQuarterly();
				} catch (rroerr) {}
			};
			$.lookAtQuarterly = function() {
					if (get("radRecur5").checked==true || get("radRecur6").checked==true || get("radRecur7").checked==true || get("radRecur8").checked==true ) {
						if ((get("radRecurQuarterly_begin").checked==false) && (get("radRecurQuarterly_end").checked==false)) {
							get("radRecurQuarterly_begin").checked = true;
						}
					} else {
						//Q1-4 deselected so deselect Use 1st, Use Last radios
						get("radRecurQuarterly_begin").checked = false;
						get("radRecurQuarterly_end").checked=false;
					}
			};
			
	//--------------------------------------------
	// Search Tree
	//--------------------------------------------
			$.searchTree = function() {
			    $.trVars.treeAction = "search";
				var t =trimspaces($("#txtGroup_Search").val());
				$.trVars.tree.findItem(t,false,false);
			}
			
	//----------------------------------------
	// Select Multiples
	//----------------------------------------
			$.selectMultiples = function() {
				var id = $.trVars.tree.getSelectedItemId();
				if (($.trVars.treeMultiSelectId=="") || ($.trVars.treeMultiSelectId==id))
				{
					//start of new multi-select, or we are operating on the same id, continue
					var childIds = $.trVars.tree.getSubItems(id).split(",");
					if ($.trVars.treeMultiSelectState=="off") {
						$.each(childIds, function(idx, val) {
							//$.trVars.tree.showItemCheckbox(val,true);
						});
						$.trVars.treeMultiSelectState="on";
						$.trVars.treeMultiSelectId=id;
					} else {
						$.each(childIds, function(idx, val) {
							//$.trVars.tree.showItemCheckbox(val,false);
						});
						$.trVars.treeMultiSelectState="off";
						$.trVars.treeMultiSelectId="";
					}
				}
			}

	//----------------------------------------
	// Sort Tree
	//----------------------------------------
			$.sortTree = function() {
			    $.trVars.treeAction = "sort";
				//var id = $.trVars.tree.getSelectedItemId();
				var id = $.trVars.rootFolderId; //start at the root
				$.trVars.treeIdSelected = id;
				if (!$.isNodeSelected(id)) 
				{
					$.handleErrorMsg("Please select a folder group item first");
					return false;
				}

				try { $.blockUI({message:$.setWaitMsg("Sorting tree structure...")}); } catch (berr1) {}
				
				//take this opportunity to update the group_session time
				//call function to determine if the tree should be read-only
				if ($.trVars.treeContextMenuState=="on") $.setTreeLock();
				
				//Perform Action
				$.trVars.tree.setCustomSortFunction($.sortTreeCustomSort);
				$.trVars.tree.sortTree(id,'ASC',true);
				//Renumber effected Nodes
				var nodeDiffs = recalculateNodes();
				if ((nodeDiffs == "|") || (nodeDiffs == "0")) {
					//already in sorted order
					try { $.unblockUI(); } catch (berr2) {}
					return true;
				}
				var nodeDiffsArr 	= nodeDiffs.split("|");
				//remove ending commas
				var sortedNodesList	= (nodeDiffsArr[1].substr(nodeDiffsArr[1].length-1,nodeDiffsArr[1].length)==",") ? 
							nodeDiffsArr[1].substr(0,nodeDiffsArr[1].length-1) : nodeDiffsArr[1];
				var beforeNodesList = (nodeDiffsArr[0].substr(nodeDiffsArr[0].length-1,nodeDiffsArr[0].length)==",") ? 
							nodeDiffsArr[0].substr(0,nodeDiffsArr[0].length-1) : nodeDiffsArr[0];
				var beforeNodesArr	= beforeNodesList.split(",");
				var beforeIdList = ""
				for (j=0;j<beforeNodesArr.length;j++) {
					try {
						beforeIdList += (j<beforeNodesArr.length-1) ? 
							$.trVars.tree.getUserData(beforeNodesArr[j],"Id") + "," : $.trVars.tree.getUserData(beforeNodesArr[j],"Id");
					} catch (errSortNodesObjId) {
						$.handleErrorMsg("Unable to determine node ids for sorting, database not updated");
						return false;
					}
				}
				var parms = {IdList: "\"" + beforeIdList + "\"" , 		
							 SortedNodeIdList: "\"" + sortedNodesList + "\""  
						   };
				//if (!confirm(beforeIdList + "\n\n" + sortedNodesList + "\n\ncontine with sort?")) return false;
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/GroupWS.asmx/SortNodes",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
                        //debugger;
                       //alert("msg." + msg);
						try {
							computeDiffsAndApply(false);
						} catch (errSort) {
							$.handleErrorMsg("Sort failed. Return Invalid. msg." + msg);
						}
						try { $.unblockUI(); } catch (berr2) {}
                    },
                    error: function(msg) {
                        //debugger;
                        $.handleErrorMsg("Error." + msg);
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;
                    }
                });
				toggleDiv("");
			}
			$.sortTreeCustomSort = function	(id1,id2) {
				//sort items by member,course,document,group.asset,group.member,group
				var type1 = determineType(id1);
				var type2 = determineType(id2);
				if (type1=="Group.Asset") type1="Z1"+type1;
				if (type2=="Group.Asset") type2="Z1"+type2;
				if (type1=="Group.Member") type1="Z2"+type1;
				if (type2=="Group.Member") type2="Z2"+type2;
				if (type1=="Group") type1="Z3"+type1;
				if (type2=="Group") type2="Z3"+type2;
				if (type1=="Member") type1="A"+type1;
				if (type2=="Member") type2="A"+type2;
				a=type1+$.trVars.tree.getItemText(id1);
				b=type2+$.trVars.tree.getItemText(id2);
				return ((a>b)?1:-1);
			}
			
			//---------------------------------------------------
			// utilities
			//---------------------------------------------------
			$.getUserData = function(id,parm) {
				var userData = "";
				try {
					userData = $.trVars.tree.getUserData(id,parm);
				} catch (errGetUD) {
					$.handleErrorMsg("Unable to determine recordId");
				}
				return userData;
			}
			$.deriveNamedGroupIconHtml = function(groupType) {
				//ex: groupType=Group.Member 
				if (groupType.replace(".","")=="GroupMember") {
					return " <img src="+$.trVars.imgSrcGroupMember+">";
				} else if (groupType.replace(".","")=="GroupAsset") {
					return " <img src="+$.trVars.imgSrcGroupAsset+">";
				}
				return ("");
			}
			$.setNodeTextIcon = function(val) {
				if ($.getUserData(val,"Image.Src").length>0) {
					$.trVars.tree.setItemText(val,$.trVars.tree.getItemText(val) +" <img src="+$.getUserData(val,"Image.Src")+">");
				}
				/* TODO: don't really need the user data, can use this code instead:
				if ($.getUserData(val,"type")=="Group.Member") {
					$.trVars.tree.setItemText(val,$.trVars.tree.getItemText(val) +" <img src="+$.trVars.imgSrcGroupMember+">");
				} else if ($.getUserData(val,"type")=="Group.Asset") {
					$.trVars.tree.setItemText(val,$.trVars.tree.getItemText(val) +" <img src="+$.trVars.imgSrcGroupAsset+">");
				} */
			}
			$.setWaitMsg = function(str) {
				var h = "<div style='padding-top:3px;vertical-align:center;'><h1>" + 
					"<img src='http://grainger.safetycertified.com/groupTree/images/ajax-loader-blue-pik.gif' align='middle'>&nbsp;" + str + "</h1></div>";
				return h;
			}

			//---------------------------
			// this function called in groupTreeHandleTemplates.js
			//---------------------------
			var myTreeGroupFolders = {
				custId: "0",
				custType: "0",
				dataType: "0",
				outputFormat: "delimited",
				outputId: "",
				//var parms = "custId="+custId+"&custType="+custType+"&dataType="+dataType+"&format="outputFormat;
				//"http://" + location.host + "/groupTree/call$getTreeGroupList.asp?",
				getTreeGroupList: function() {
					var parms = "custId="+this.custId+"&custType="+this.custType+"&dataType="+this.dataType+"&format="+this.outputFormat;
					//alert("http://" + location.host + "/groupTree/call$getTreeGroupList.asp?" + parms);
					$.ajax({
						url: "http://" + location.host + "/groupTree/call$getTreeGroupList.asp",
						global: false,
						type: "POST",
						cache: false,
						data: (parms),
						dataType: "html",
						success: function(msg) {
							//alert("msg:\n\n" + msg);
							try {
								$.handleTreeGroupList(myTreeGroupFolders.outputId,myTreeGroupFolders.outputFormat,msg);
							} catch (loadErr) {
								alert("loading document list failed");
							}
						},
						error: function(msg) {
							//debugger;
							alert("Error." + msg);
						},
						complete: function() {
							// unblock when remote call returns 
							//debugger;
						}
					});
				}
			}
			$.handleTreeGroupList = function(outputId,outputFormat,msg) {
				if (outputFormat=="listbox") {
					$("#"+outputId).html(msg); 
				}
			}
  
	//==========================================================================
	// CONTEXT MENU
	//==========================================================================
	function setupContextMenu(itemId) {
		//this function is attached to the onBeforeContextMenu event
					var type = determineType(itemId);
					$.trVars.tree.selectItem(itemId);
					if (itemId==$.trVars.rootFolderId || $.trVars.treeContextMenuState=="off") {
							$.trVars.menu.hideItem('edit_addGroup');
							if ((itemId==$.trVars.rootFolderId) && ($.trVars.treeContextMenuState!="off")) $.trVars.menu.showItem('edit_addGroup');
							$.trVars.menu.hideItem('edit_addMember');
							$.trVars.menu.hideItem('edit_addCourse');
							$.trVars.menu.hideItem('edit_addCustomTraining');
							$.trVars.menu.hideItem('edit_addDocument');
							$.trVars.menu.hideItem('edit_addCompany');
							$.trVars.menu.hideItem('edit_addCourseGroup');
							$.trVars.menu.hideItem('edit_addTraineeGroup');
							$.trVars.menu.hideItem('edit_rename');
							$.trVars.menu.hideItem('edit_select');
							$.trVars.menu.hideItem('edit_delete');
							$.trVars.menu.hideItem('view_member');
							$.trVars.menu.hideItem('view_course');
							$.trVars.menu.hideItem('view_customtraining');
							$.trVars.menu.hideItem('view_document');
							$.trVars.menu.hideItem('view_company');
							$.trVars.menu.hideItem('view_reseller');
							$.trVars.menu.hideItem('open_tree');
							$.trVars.menu.hideItem('schedules');
							$.trVars.menu.showItem('sep1');
							$.trVars.menu.hideItem('sep2');
							$.trVars.menu.hideItem('sep3');
							$.trVars.menu.hideItem('edit_movedrop');
							$.trVars.menu.hideItem('edit_copypaste');
							$.trVars.menu.hideItem('edit_copy');
							$.trVars.menu.hideItem('edit_move');
							$.trVars.menu.hideItem('cancel_move');
							$.trVars.menu.hideItem('cancel_copy');
							$.trVars.menu.hideItem('edit_sort');
							$.trVars.menu.showItem('edit_search');
							if (type=="Group") $.trVars.menu.showItem('open_tree');
							if (itemId==$.trVars.rootFolderId && $.trVars.appCustType=="company" && $.trVars.treeContextMenuState=="on") {
								$.trVars.menu.showItem('view_company');
								$.trVars.menu.showItem('sep3');
								$.trVars.menu.showItem('edit_sort');
							} else if (itemId==$.trVars.rootFolderId && $.trVars.treeContextMenuState=="on") {
								$.trVars.menu.showItem('edit_sort');
								$.trVars.menu.showItem('sep3');
								$.trVars.menu.showItem('view_reseller');
								}
							return true;
					}
					//fully enabled context menu:
					if ((type=="Group") || (type=="Group.Asset") || (type=="Group.Member")) {
							$.trVars.menu.showItem('edit_addGroup');
							$.trVars.menu.showItem('edit_addCourseGroup');
							$.trVars.menu.showItem('edit_addTraineeGroup');
							$.trVars.menu.showItem('edit_addMember');
							$.trVars.menu.showItem('edit_addCourse');
							$.trVars.menu.showItem('edit_addCustomTraining');
							$.trVars.menu.showItem('edit_addDocument');
							$.trVars.menu.hideItem('edit_addCompany');
							$.trVars.menu.hideItem('edit_sort');
							$.trVars.menu.showItem('edit_select');
							if (type=="Group") {
								$.trVars.menu.showItem('edit_addGroup');
								$.trVars.menu.showItem('edit_addCourseGroup');
								$.trVars.menu.showItem('edit_addTraineeGroup');
								$.trVars.menu.hideItem('edit_addMember');
								$.trVars.menu.hideItem('edit_addCourse');
								$.trVars.menu.hideItem('edit_addCustomTraining');
								$.trVars.menu.hideItem('edit_addDocument');
								// if ($.trVars.appCustType=="reseller") {
								//	$.trVars.menu.showItem('edit_addCompany');  
								// }
							}
							if (type=="Group.Asset") {
								$.trVars.menu.hideItem('edit_addGroup');
								$.trVars.menu.hideItem('edit_addCourseGroup');
								$.trVars.menu.hideItem('edit_addTraineeGroup');
								$.trVars.menu.hideItem('edit_addMember');
							} else if (type=="Group.Member") {
								$.trVars.menu.hideItem('edit_addGroup');
								$.trVars.menu.hideItem('edit_addCourseGroup');
								$.trVars.menu.hideItem('edit_addTraineeGroup');
								$.trVars.menu.hideItem('edit_addCourse');
								$.trVars.menu.hideItem('edit_addCustomTraining');
								$.trVars.menu.hideItem('edit_addDocument');
								//if ($.trVars.appCustType=="reseller") $.trVars.menu.showItem('edit_addCompany');
							} 
							$.trVars.menu.showItem('sep1');
							$.trVars.menu.showItem('sep2');
							$.trVars.menu.showItem('edit_rename');
							$.trVars.menu.showItem('edit_search');
							$.trVars.menu.showItem('edit_delete');
							$.trVars.menu.hideItem('view_member');
							$.trVars.menu.hideItem('view_course');
							$.trVars.menu.hideItem('view_customtraining');
							$.trVars.menu.hideItem('view_document');
							$.trVars.menu.hideItem('view_company');
							$.trVars.menu.hideItem('view_reseller');
							$.trVars.menu.showItem('open_tree');
							$.trVars.menu.showItem('sep3');
							$.trVars.menu.showItem('schedules');
							if (itemId==$.trVars.rootFolderId && $.trVars.appCustType=="company") {
								$.trVars.menu.showItem('view_company');  	//this company's profile
								$.trVars.menu.hideItem('edit_select');
							} else if (itemId==$.trVars.rootFolderId && $.trVars.appCustType=="reseller") {
								$.trVars.menu.showItem('view_reseller');  //list of company profiles
								$.trVars.menu.hideItem('edit_select');
							} 
					} else {
							//item leaf - member, document, course, company
							$.trVars.menu.hideItem('edit_addGroup');
							$.trVars.menu.hideItem('edit_addCourseGroup');
							$.trVars.menu.hideItem('edit_addTraineeGroup');
							$.trVars.menu.hideItem('edit_addMember');
							$.trVars.menu.hideItem('edit_addCourse');
							$.trVars.menu.hideItem('edit_addCustomTraining');
							$.trVars.menu.hideItem('edit_addDocument');
							$.trVars.menu.hideItem('edit_addCompany');
							$.trVars.menu.hideItem('edit_rename');
							$.trVars.menu.showItem('edit_search');
							$.trVars.menu.showItem('edit_delete');
							$.trVars.menu.hideItem('view_company');
							$.trVars.menu.hideItem('view_reseller');
							$.trVars.menu.hideItem('view_member');
							$.trVars.menu.hideItem('view_course');
							$.trVars.menu.hideItem('view_customtraining');
							$.trVars.menu.hideItem('view_document');
							$.trVars.menu.hideItem('open_tree');
							$.trVars.menu.hideItem('edit_select');
							$.trVars.menu.hideItem('edit_sort');
							$.trVars.menu.hideItem('sep1');
							$.trVars.menu.hideItem('sep2');
							if (type=="Member") {
								$.trVars.menu.showItem('view_member');
								$.trVars.menu.showItem('sep3');
								$.trVars.menu.showItem('schedules');
							} else if (type=="Course") {
								$.trVars.menu.showItem('view_course');
								$.trVars.menu.showItem('sep3');
								$.trVars.menu.showItem('schedules');
							} else if (type=="Document") {
								$.trVars.menu.showItem('view_document');
								$.trVars.menu.showItem('sep3');
								$.trVars.menu.hideItem('schedules');
							} else if (type=="Company") {
								$.trVars.menu.showItem('view_company');
								$.trVars.menu.showItem('sep3');
								$.trVars.menu.showItem('schedules');
							} else if (type=="CustomTraining") {
								$.trVars.menu.showItem('view_customtraining');
								$.trVars.menu.showItem('sep3');
								$.trVars.menu.showItem('schedules');
							}
					}
					if ($.trVars.treeAction=="copy") {
							//this is the paste operation of the copy
							$.trVars.menu.hideItem('edit_addGroup');
							$.trVars.menu.hideItem('edit_addCourseGroup');
							$.trVars.menu.hideItem('edit_addTraineeGroup');
							$.trVars.menu.hideItem('edit_addMember');
							$.trVars.menu.hideItem('edit_addCourse');
							$.trVars.menu.hideItem('edit_addCustomTraining');
							$.trVars.menu.hideItem('edit_addDocument');
							$.trVars.menu.hideItem('edit_addCompany');
							$.trVars.menu.hideItem('edit_rename');
							$.trVars.menu.hideItem('edit_search');
							$.trVars.menu.hideItem('edit_delete');
							$.trVars.menu.hideItem('view_member');
							$.trVars.menu.hideItem('view_course');
							$.trVars.menu.hideItem('view_customtraining');
							$.trVars.menu.hideItem('view_document');
							$.trVars.menu.hideItem('view_company');
							$.trVars.menu.hideItem('view_reseller');
							$.trVars.menu.hideItem('open_tree');
							$.trVars.menu.hideItem('sep1');
							$.trVars.menu.hideItem('sep2');
							$.trVars.menu.hideItem('sep3');
							$.trVars.menu.hideItem('schedules');
							$.trVars.menu.hideItem('edit_sort');
						$.trVars.menu.showItem('edit_copypaste');
						$.trVars.menu.showItem('cancel_copy');
						$.trVars.menu.hideItem('edit_movedrop');
						$.trVars.menu.hideItem('edit_copy');
						$.trVars.menu.hideItem('edit_move');
						$.trVars.menu.hideItem('cancel_move');
					} else if ($.trVars.treeAction=="move") {
							//this is the drop operation of the move
							$.trVars.menu.hideItem('edit_addGroup');
							$.trVars.menu.hideItem('edit_addCourseGroup');
							$.trVars.menu.hideItem('edit_addTraineeGroup');
							$.trVars.menu.hideItem('edit_addMember');
							$.trVars.menu.hideItem('edit_addCourse');
							$.trVars.menu.hideItem('edit_addCustomTraining');
							$.trVars.menu.hideItem('edit_addDocument');
							$.trVars.menu.hideItem('edit_addCompany');
							$.trVars.menu.hideItem('edit_rename');
							$.trVars.menu.hideItem('edit_search');
							$.trVars.menu.hideItem('edit_delete');
							$.trVars.menu.hideItem('view_member');
							$.trVars.menu.hideItem('view_course');
							$.trVars.menu.hideItem('view_customtraining');
							$.trVars.menu.hideItem('view_document');
							$.trVars.menu.hideItem('view_company');
							$.trVars.menu.hideItem('view_reseller');
							$.trVars.menu.hideItem('open_tree');
							$.trVars.menu.hideItem('sep1');
							$.trVars.menu.hideItem('sep2');
							$.trVars.menu.hideItem('sep3');
							$.trVars.menu.hideItem('schedules');
							$.trVars.menu.hideItem('edit_sort');
						$.trVars.menu.showItem('edit_movedrop');
						$.trVars.menu.showItem('cancel_move');
						$.trVars.menu.hideItem('edit_copypaste');
						$.trVars.menu.hideItem('edit_move');
						$.trVars.menu.hideItem('cancel_copy');
						$.trVars.menu.hideItem('edit_copy');
					} else {
						$.trVars.menu.hideItem('edit_movedrop');
						$.trVars.menu.hideItem('edit_copypaste');
						$.trVars.menu.showItem('edit_copy');
						$.trVars.menu.showItem('edit_move');
						$.trVars.menu.hideItem('cancel_move');
						$.trVars.menu.hideItem('cancel_copy');
					}
		return true;
	}

	function onButtonClick(menuitemId, type) {
		var id = $.trVars.tree.contextID;
		$.trVars.tree.selectItem(id);
		switch (menuitemId) {
			case "edit_addGroup":
				toggleDiv('Group_Add');
				break;
			case "edit_addNamedGroup":
				toggleDiv('NamedGroup_Add');
				break;
			case "edit_addCourseGroup":
				toggleDiv('AssetGroup_Add');
				break;
			case "edit_addTraineeGroup":
				toggleDiv('MemberGroup_Add');
				break;
			case "edit_addMember":
				toggleDiv('Member');
				break;
			case "edit_addCourse":
				toggleDiv('Course');
				break;
			case "edit_addDocument":
				toggleDiv('Document');
				break;
			case "edit_addCompany":
				toggleDiv('Company');
				getCompanyListing();
				break;
			case "edit_rename":
				toggleDiv('Group_Rename');
				break;
			case "edit_select":
				//this was the TESTING option in the xml
				$.selectMultiples();
				break;
			case "edit_search":
				toggleDiv('Group_Search');
				break;
			case "edit_sort":
				toggleDiv('');
				$.sortTree();
				break;
			case "edit_copy":
				toggleDiv('copy');
				$.copySelect();
				break;
			case "cancel_copy":
				$.copyCancel();
				break;
			case "edit_delete":
				toggleDiv('');
				$.deleteNode();
				break;
			case "edit_move":
				toggleDiv('move');
				$.moveItems();
				break;
			case "cancel_move":
				$.moveItemsCancel();
				break;
			case "edit_copypaste":
				$.checkTokens('copy','');
				break;
			case "edit_movedrop":
				$.checkTokens('move','');
				break;
			case "view_member":
				$.openMemberWindow();
				break;
			case "view_course":
				$.openCourseWindow();
				break;
			case "view_document":
				$.openDocumentWindow();
				break;
			case "view_company":
				$.openCompanyWindow();
				break;
			case "view_reseller":
				getCompanyListbox4reseller();
				toggleDiv('ResellerCompany');
				break;
			case "option_schedule":
				getTrainingSchedule();
				toggleDiv('schedule');
				break;
			case "view_schedule_customer":
				getAppliedCustomerSchedules();
				toggleDiv('schedule_customer');
				break;
			case "view_schedule_applied":
				getAppliedTrainingSchedule();
				toggleDiv('schedule_applied');
				break;
			case "edit_addCustomTraining":
				toggleDiv('CustomTraining');
				break;
			case "view_customtraining":
				$.openCustomTrainingWindow();
				break;
			case "open_tree":
				$.trVars.tree.openAllItems($.trVars.tree.getSelectedItemId());
				break;
		}
	}
	$.openCompanyWindow = function() {
		$.blockUI({message:$.setWaitMsg("Retrieving company profile...")});
		var id = $.trVars.tree.getSelectedItemId();
		var thisId = $.getUserData(id,"Id");
		document.getElementById("ifrProfile").src = "";
		var treeProfileUrl = "/groupTree/CompanyProfile.asp?menu=off&source=tree&id="+thisId+"&cid=&usertype="+$.trVars.appCustType+"&type=company&context="+$.trVars.appContext;
		document.getElementById("ifrProfile").src = treeProfileUrl;
		toggleDiv("profile");
	}
	$.openDocumentWindow = function() {
		var id = $.trVars.tree.getSelectedItemId();
		var thisId = $.getUserData(id,"Id");
		window.open('/groupTree/PopSharedDoc.asp?source=tree&id='+thisId,'SharedDocument','width=750,height=600,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');
		toggleDiv("profile");
	}
	$.openMemberWindow = function() {
		$.blockUI({message:$.setWaitMsg("Retrieving member profile...")});
		var id = $.trVars.tree.getSelectedItemId();
		var thisId = $.getUserData(id,"Id");
		document.getElementById("ifrProfile").src = '/groupTree/MemberProfile.asp?source=tree&id='+thisId;
		toggleDiv("profile");
		//window.open('/groupTree/MemberProfile.asp?source=tree&id='+thisId,'MemberProfile','width=700,height=600,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');
	}
	$.openCourseWindow = function() {
		var id = $.trVars.tree.getSelectedItemId();
		var thisId = $.getUserData(id,"Id");
		var txt = $.trVars.tree.getItemText($.trVars.rootFolderId).replace("'","@@@");
		var txt = $.trVars.tree.getItemText($.trVars.rootFolderId).replace("&","$$$");
		document.getElementById("ifrProfile").src = '/groupTree/CourseProfile.asp?source=tree&id='+thisId+'&custname='+txt;
		toggleDiv("profile");
	}
	$.openCustomTrainingWindow = function() {
		var id = $.trVars.tree.getSelectedItemId();
		var thisId = $.getUserData(id,"Id");
		var txt = $.trVars.tree.getItemText(id).replace("'","@@@");
		var txt = $.trVars.tree.getItemText(id).replace("&","$$$");
		document.getElementById("ifrProfile").src = '/groupTree/CustomTrainingProfile.asp?source=tree&id='+thisId+'&name='+txt;
		toggleDiv("profile");
	}
	//
	//===========================================================================
	// Utility functions
	//===========================================================================
	//
	//--------------------------------------------------------------------------
	// Calculate the tree nodeId of the next child under this parentId
	// ex: if parentId is 1.2.4, child ids will be 1.2.4.1, 1.2.4.2, 1.2.4.3,etc
	//--------------------------------------------------------------------------
	function calculateId(parentId) {
		var pId = parentId;
		if (pId == "1.0") pId = "1";
		var newId = pId + ".1"; //default when there are no children
		var subItems = $.trVars.tree.getSubItems(parentId);
		var parentLvl = $.trVars.tree.getLevel(newId);
		if (subItems != null && subItems != "") {
			var subarr = subItems.split(",");
			var lastItem = subarr[subarr.length-1];
			var lastDigit = lastItem.substr(lastItem.lastIndexOf(".")+1,999);
			newId = pId + "." + (parseInt(lastDigit)+1);
		}
		return newId;
	}
	function calculateSiblingId(Id) {
		var firstPart = Id.substr(0,Id.lastIndexOf("."));
		var lastDigit = Id.substr(Id.lastIndexOf(".")+1,999);
		var newId = firstPart + "." + (parseInt(lastDigit)+1);
		return newId;
	}
	function determineType(id) {
		var type = "unk";
		//check first to see if type is in userdata
		try {
			type = $.trVars.tree.getUserData(id,"type");
		} catch (err1) {
			//next try to determine type from image name
			try {
				var img = $.trVars.tree.getItemImage(id);
				var itemText = $.trVars.tree.getItemText(id);
					if (img.indexOf("document") > 0 ) {
						type="Document";
					} else if (img.indexOf("course") > 0) {
						type="Course"
					} else if (img.indexOf("customtraining") > 0) {
						type="CustomTraining"
					} else if (img.indexOf("company") > 0) {
						type="Company"
					} else if (itemText.indexOf($.trVars.imgSrcGroupAsset) > 0) {
						type="Group.Asset"
					} else if (itemText.indexOf($.trVars.imgSrcGroupMember) > 0) {
						type="Group.Member"
					} else if (img.indexOf("member") > 0) {
						type="Member";
					} else if (img.indexOf("folder") >= 0) {
						type = "Group";
					}
			} catch (err2) {};
		};
		return type;
	}
	function getParentNodeId(nodeId) {
		//nodeId = "1.8.3", return "1.8"
		var firstPart = nodeId.substr(0,nodeId.lastIndexOf("."));
		return firstPart;
	}
	function removeEndingComma(str) {
		var newstr = str;
		if ((newstr.length) > 0 && (newstr.substr(newstr.length-1,newstr.length)==",")) {
			newstr = newstr.substr(0,newstr.length-1);
		}
		return newstr;
	}
	function removeEndingChar(str,char) {
		var newstr = str;
		if ((newstr.length) > 0 && (char.length>0) && (newstr.substr(newstr.length-1,newstr.length)==char)) {
			newstr = newstr.substr(0,newstr.length-1);
		}
		return newstr;
	}
	//=========================================================
	// Calculation Functions
	//=========================================================

	//----------------------------------------------------
	// generate list of new nodeIds, report differences
	//----------------------------------------------------
	function recalculateNodes() {
		var nodeList = $.trVars.tree.getAllSubItems($.trVars.rootFolderId);
		$.trVars.treeNodesInObject = $.trVars.rootFolderId + "," + nodeList;  //global var
		$.trVars.treeNodesRecalculated = $.trVars.rootFolderId; //global var
		var str = "(1) " + $.trVars.rootFolderId + " " + $.trVars.tree.getItemText($.trVars.rootFolderId) + "<br />";  //debug string
		var Lvl = 1;    //previous level
		var Node = "1"; //previous node
		var thisLvl = 1;  
		var newNode = "1";
		var chararr;
		var s;
		var beforeStr = "";
		var afterStr = "";
		if (nodeList && nodeList.length > 0) {
			var nodeArr = nodeList.split(",");
			for (i=0;i<nodeArr.length;i++) {
				thisLvl = $.trVars.tree.getLevel(nodeArr[i]);
				thisText =  $.trVars.tree.getItemText(nodeArr[i]);
				if (thisLvl > Lvl) {
					//the level just indented right, so this is a first child
					newNode = Node + ".1";
				} else if (thisLvl == Lvl ) {
					newNode = calculateSiblingId(Node);
				} else	{
					//the indentation shifted left (< previous level)
					chararr = Node.split(".");
					//ex: 1.4.3.2, the parents will be 1 or 1.4 or 1.4.3 
					s = "";
					//get the first n=thisLvl number of digits in the Node
					//ex: previous level=4, node = 1.4.3.2
					//    this level = 2, the indentation is twice in, 
					//    so the parent would be the first 2 digits in the previous node, thus 1.4 is the parent.
					//    This node's id would be the parent's sibling = 1.5
					//    (4) 1.4.3.2
					//    (2) 1.5
					for (j=0;j<parseInt(thisLvl);j++) {
						s = s + chararr[j];
						if (j < parseInt(thisLvl)-1) s = s+".";
					}
					newNode = calculateSiblingId(s);
				}
				Lvl = thisLvl;
				Node = newNode;
				//capture all newly calculated nodeIds
				$.trVars.treeNodesRecalculated += "," + newNode;
				//construct debug string
				str += "(" + thisLvl + ") " + newNode + " " + thisText + "<br />";
				//capture all differences in nodes due to moves or deletions
				if (newNode != nodeArr[i]) {
					beforeStr += nodeArr[i] + ",";
					afterStr += newNode + ",";
				}
			}
			$.trVars.treeNodesCalculatedView = str;
			return (beforeStr + "|" + afterStr);
		}
		$.trVars.treeNodesCalculatedView = str;
		return "0";
	}
	//--------------------------------------------------
	// Apply newly computed nodes to the tree object
	//--------------------------------------------------
	function computeDiffsAndApply(sort) {
		var objTreeArr = $.trVars.treeNodesInObject.split(",");
		var newTreeArr = $.trVars.treeNodesRecalculated.split(",");
		for (i=0;i<objTreeArr.length;i++) {
			if (objTreeArr[i] != newTreeArr[i]) {
				if ((objTreeArr[i] != "") && (newTreeArr[i] != "")) {
					$.trVars.tree.changeItemId(objTreeArr[i],newTreeArr[i]+"end");
				}
			}
			if (i==objTreeArr.length-1) {
				cleanUpTreeNodes(sort);
			}
		}
	}
	function cleanUpTreeNodes(sort) {
		var nodeList = $.trVars.tree.getAllSubItems($.trVars.rootFolderId);
		nodeListArr = nodeList.split(",");
		for (j=0;j<nodeListArr.length;j++) {
			newid = nodeListArr[j].replace("end","");
			$.trVars.tree.changeItemId(nodeListArr[j],newid);
			if ((sort==true) && (j==nodeListArr.length-1)){
				$.sortTree();
			}
		}
	}

	//=========================================================
	//formatting functions
	//=========================================================
	function treeWidthMore(n) {
		var t = document.getElementById("treeBox").style.width;
		t = t.replace("px","");
		t = parseInt(t) + parseInt(n);
		//alert("treeBox:" + document.getElementById("treeBox").style.width);
		//alert("t:" + t);
		//alert(t+"px");
		document.getElementById("treeBox").style.width = t + "px";
		document.getElementById("spAdjustWidth").style.marginLeft = (t-20) + "px";
	}
	function treeWidthLess(n) {
		var t = document.getElementById("treeBox").style.width;
		t = t.replace("px","");
		if ((parseInt(t) < 80) && (parseInt(t) > 25)) {
			t = parseInt(t) - 50 ;
		} else if (parseInt(t) > (parseInt(n)+25)) {
			t = parseInt(t) - parseInt(n);
		}
		document.getElementById("treeBox").style.width = t + "px";
		document.getElementById("spAdjustWidth").style.marginLeft = (t-20) + "px";
	}
	function treeHeightMore() {
		var t = document.getElementById("treeBox").style.height;
		t = t.replace("px","");
		t = parseInt(t) + 50;
		document.getElementById("treeBox").style.height = t + "px";
	}
	
	//-----------------------
	// clear/check checkboxes
	//-----------------------
	function clearCbx(id) {
		var cbxArr = document.getElementsByName("cbx"+id);
		for (i=0;i<cbxArr.length;i++) {
			cbxArr[i].checked = false;
		}
	}
	function checkCbx(id) {
		var cbxArr = document.getElementsByName("cbx"+id);
		for (i=0;i<cbxArr.length;i++) {
			if (cbxArr[i].disabled!=true) cbxArr[i].checked = true;
		}
	}
	
	//-------------------------------------------------------------------
	// turn on/off the display of the selected asset selection div
	// turn off all other asset selection div
	/*
		get("btnAddMember").style.display="none";
		get("btnAddMember2Template").style.display = "block";
	*/
	//-------------------------------------------------------------------
	function toggleDiv(dname) {
		$.trVars.treeAction = "";
		var divname = dname;
		switch (dname) {
			case "MemberTemplate":
				divname = "Member";
				break;
			case "CourseTemplate":
				divname = "Course";
				break;
			case "CustomTrainingTemplate":
				divname = "CustomTraining";
				break;
			case "DocumentTemplate":
				divname = "Document";
				break;
			case "scheduleTemplate":
				divname = "schedule";
				break;
		}
		var thisDivName = "divasset_" + divname; 
		var div = document.getElementById(thisDivName);
		try {
			if (div.style.display == "block") {
				if (divname=="") div.style.display = "none";
			} else {
				div.style.display = "block";
				$.clearMsg();
				try {
					if (dname=="MemberTemplate") {
						get("btnAddMember").style.display="none";
						get("btnAddMember2Template").style.display = "block";
						getCompanyListbox4members();
					} else if (dname=="Member") {
						get("btnAddMember").style.display="block";
						get("btnAddMember2Template").style.display = "none";
						getCompanyListbox4members();
					} else if (dname=="DocumentTemplate") {
						get("btnAddDocument").style.display="none";
						get("btnAddDocument2Template").style.display = "block";
						getCompanyListbox4documents();
					} else if (dname=="Document") {
						get("btnAddDocument").style.display="block";
						get("btnAddDocument2Template").style.display = "none";
						getCompanyListbox4documents();
					} else if (dname=="CustomTrainingTemplate") {
						get("btnAddCustomTraining").style.display="none";
						get("btnAddCustomTraining2Template").style.display = "block";
						getCompanyListbox4customTraining();
					} else if (dname=="CustomTraining") {
						get("btnAddCustomTraining").style.display="block";
						get("btnAddCustomTraining2Template").style.display = "none";
						getCompanyListbox4customTraining();
					} else if (dname=="CourseTemplate") {
						get("btnAddCourse").style.display="none";
						get("btnAddCourse2Template").style.display = "block";
						getCourseListing();
					} else if (dname=="Course") {
						get("btnAddCourse").style.display="block";
						get("btnAddCourse2Template").style.display = "none";
						getCourseListing();
					} else if (dname=="scheduleTemplate") {
						get("btnScheduleWizard").style.display="block";
						get("btnSchedule").style.display = "none";
						getTrainingSchedule();
					} else if (dname=="schedule") {
						get("btnScheduleWizard").style.display="none";
						get("btnSchedule").style.display = "block";
					}
					if (divname=="ResellerCompany") getResellerCompanyListing();
					if (divname=="Group_Rename") {
						var id = $.trVars.tree.getSelectedItemId();
						var itemText = $.trVars.tree.getItemText(id)
						document.getElementById("txtGroup_Rename").value = cleanUpItemText(itemText);
					}
					if (divname=="MemberGroup_Add") getPeopleTemplates4Select("selectTreePeopleTemplates");
					if (divname=="AssetGroup_Add") getTrainingTemplates4Select("selectTreeTrainingTemplates");
				} catch(tog1) {}
			}
		} catch(tog2) {}
		var divArr = document.getElementsByTagName("DIV");
		//turn off all other divasset_ 
		for (i=0;i<divArr.length;i++) {
			if ((divArr[i].id.indexOf("divasset_") == 0) && (divArr[i].id != thisDivName)) {
				document.getElementById(divArr[i].id).style.display="none";
			}
		}
	}
	function cleanUpItemText(txt) {
		var thisTxt = txt;
		var pos = thisTxt.indexOf("<IMG");
		if (pos=="-1" || pos=="0") pos = thisTxt.indexOf("<img");
		if (pos>0) thisTxt = thisTxt.substr(0,pos-1);
		return thisTxt;
	}

	//=========================================================
	//=========================================================
	// DEBUG TREE NODES functions
	//=========================================================
	//=========================================================
	function showNodes() {
		var nodeList = $.trVars.tree.getAllSubItems($.trVars.rootFolderId);
		var str = "";
		if (nodeList && nodeList.length > 0) {
			nodeList = $.trVars.rootFolderId + "," + nodeList;
			var nodeArr = nodeList.split(",");
			for (i=0;i<nodeArr.length;i++) {
				str += "("+$.trVars.tree.getLevel(nodeArr[i]) + ") " +nodeArr[i] + " " + $.trVars.tree.getItemText(nodeArr[i]) + "\n";
			}
			//alert(str);
			$.trVars.treeNodesView = str.replace(/\n/gi,"<br />");
			document.getElementById("objTreeView").innerHTML = $.trVars.treeNodesView;
			return true;
		}
		document.getElementById("objTreeView").innerHTML = "(1) " + $.trVars.rootFolderId + " " + $.trVars.tree.getItemText($.trVars.rootFolderId);
	}
	function showRecalculatedNodes() {
		var s = recalculateNodes();
		document.getElementById("newTreeView").innerHTML = $.trVars.treeNodesCalculatedView;
	}
	function showTreeDiffs() {
		var objTreeArr = $.trVars.treeNodesView.split("<br />");
		var newTreeArr = $.trVars.treeNodesCalculatedView.split("<br />");
		//alert(objTreeArr.length + "," + $.trVars.treeNodesView);
		//alert(newTreeArr.length + "," + $.trVars.treeNodesCalculatedView);
		var str1 = "";
		var str2 = "";
		for (i=0;i<objTreeArr.length;i++) {
			if (objTreeArr[i] != newTreeArr[i]) {
				str1 += objTreeArr[i] + "<br />"
				str2 += newTreeArr[i] + "<br />";
			}
		}
		document.getElementById("objDiffs").innerHTML = str1;
		document.getElementById("newDiffs").innerHTML = str2;
	}
	function showApplyRecalculatedNodes() {
		var objTreeArr = $.trVars.treeNodesView.split("<br />");
		var newTreeArr = $.trVars.treeNodesCalculatedView.split("<br />");
		//alert(objTreeArr.length + "," + $.trVars.treeNodesView);
		//alert(newTreeArr.length + "," + $.trVars.treeNodesCalculatedView);
		var str1Arr = "";
		var str2Arr = "";
		for (i=0;i<objTreeArr.length;i++) {
			if (objTreeArr[i] != newTreeArr[i]) {
				str1Arr = objTreeArr[i].split(" ");
				str2Arr = newTreeArr[i].split(" ");
				$.trVars.tree.changeItemId(str1Arr[1],str2Arr[1]+"end");
			}
			if (i==objTreeArr.length-1) {
				cleanItUp();
			}
		}
	}
	function cleanItUp() {
		var nodeList = $.trVars.tree.getAllSubItems($.trVars.rootFolderId);
		nodeListArr = nodeList.split(",");
		for (j=0;j<nodeListArr.length;j++) {
			newid = nodeListArr[j].replace("end","");
			$.trVars.tree.changeItemId(nodeListArr[j],newid);
		}
	}
	function showNodesData() {
		var nodeList = $.trVars.tree.getAllSubItems($.trVars.rootFolderId);
		var str = "";
		var strtable = "<table border='1' cellspacing='0' cellpadding='2'>"
		var strdata = "";
		if (nodeList && nodeList.length > 0) {
			nodeList = $.trVars.rootFolderId + "," + nodeList;
			var nodeArr = nodeList.split(",");
			for (i=0;i<nodeArr.length;i++) {
				//str += "("+$.trVars.tree.getLevel(nodeArr[i]) + ") " +nodeArr[i] + " " + $.trVars.tree.getItemText(nodeArr[i]) + "\n";
				strtable += "<tr><td>" + "("+$.trVars.tree.getLevel(nodeArr[i]) + ") " +nodeArr[i] + " " + $.trVars.tree.getItemText(nodeArr[i]) + "</td>";
				try {
					strtable += "<td>Id:" + $.trVars.tree.getUserData(nodeArr[i],"Id") + " | Type:" + $.trVars.tree.getUserData(nodeArr[i],"type") + 
									" | parentId:" + $.trVars.tree.getUserData(nodeArr[i],"parentId") + " | TemplateId:" + $.trVars.tree.getUserData(nodeArr[i],"TemplateId") + "</td></tr>";
				} catch(e) {
				
				}
			}
			strtable += "</table>";
			document.getElementById("tdShowUserData").innerHTML = strtable;
			return true;
		}
	}
	//end tree debugging functions

