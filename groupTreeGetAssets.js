/*
5/4/2011 add CustomTraining asset type
*/ 
	//-----------------------------------------------------------------------
	// Methods to get assignment data
	//-----------------------------------------------------------------------
	obj_page_vars = {
		"appCustId":"",
		"appCustType":"",
		"appContext":"",
		"assetType":"",
		"memberCompanyListBox":"",
		"memberCompanyListBoxBuilt":"no",
		"memberCompanyName":"",
		"memberCompanyAttributes":"",
		"memberCompanyListBoxValue":"",
		"documentCompanyListBox":"",
		"documentCompanyListBoxBuilt":"no",
		"documentCompanyName":"",
		"customTrainingCompanyListBox":"",
		"customTrainingCompanyListBoxBuilt":"no",
		"customTrainingCompanyName":"",
		"resellerCompanyListBox":"",
		"resellerCompanyListBoxBuilt":"no",
		"resellerCompanyListBoxValue":"",
		"resellerName":"",
		"companyName":"",
		"companyStr":"",
		"companyUCC":""
	}

	var myCompanyNames = {
		resellerId: "0",
		resellerCode: "unk",
		companyId: "0",
		getCompanyNamesForReseller: function() {
				var parms = {"ResellerId":parseInt(this.resellerId)};
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/CompanyWs.asmx/GetCompanyNamesByResellerId",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
						//alert("msg:\n\n" + msg);
						try {
							if (obj_page_vars.assetType=="Member") $.handleMemberCompanyListBox(msg);
							if (obj_page_vars.assetType=="Document") $.handleDocumentCompanyListBox(msg);
							if (obj_page_vars.assetType=="CustomTraining") $.handleCustomTrainingCompanyListBox(msg);  
							if (obj_page_vars.assetType=="Reseller") $.handleResellerCompanyListBox(msg);
							if (obj_page_vars.assetType=="Company") $.handleCompanyList(msg);
							if (obj_page_vars.assetType=="ResellerCompany") $.handleResellerCompanyList(msg);
						} catch (loadErr) {
							alert("loading company list failed");
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
		},
		getCompanyNameForId: function() {
				var parms = {"CompanyId":parseInt(this.companyId)};
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/CompanyWs.asmx/GetCompanyNameById",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
						//alert("msg:\n\n" + msg);
						try {
							$.handleCompanyName(msg);
						} catch (loadErr) {
							alert("loading company name failed");
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
		},
		getResellerNameForId: function() {
				var parms = {"ResellerId":parseInt(this.resellerId)};
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/ResellerWs.asmx/GetResellerNameById",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
						//alert("msg:\n\n" + msg);
						try {
							$.handleResellerName(msg);
						} catch (loadErr) {
							alert("loading reseller name failed");
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
	};
	
	var myMemberList = {
		memberId: "0",
		companyId: "0",
		keyword: "",
		getActiveMembersByCompanyId: function() {
				var parms = {"CompanyId":parseInt(this.companyId),"filter":"\""+this.keyword.replace("\"","")+"\""};
				$.blockUI({message:$.setWaitMsg("Retrieving company members...")});
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/MemberWs.asmx/GetActiveMembersByCompanyId",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
						//alert("msg:\n\n" + msg);
						try {
							$.handleMemberList(msg);
							$.unblockUI();
						} catch (loadErr) {
							alert("loading member list failed");
							$.unblockUI();
						}
                    },
                    error: function(msg) {
                        //debugger;
                        alert("Error." + msg);
						$.unblockUI();
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;
                    }
                });
		}
	};
	
	var myDocumentList = {
		memberId: "0",
		companyId: "0",
		resellerId: "0",
		keyword: "",
		customerId: "0",
		customerType: "",
		getSharedDocumentsByCustomerId: function() {
				var parms = {"CustomerId":parseInt(this.customerId),"ApplicationCustomerType":"\"" + this.customerType + "\"","filter":"\"" + this.keyword + "\""};
				//alert("TESTING GetSharedDocumentsByCustomerId\n\nCustomerId:" + this.customerId + "\nApplicationCustomerType:" + this.customerType + "\nfilter:" + this.keyword);
				$.blockUI({message:$.setWaitMsg("Retrieving shared documents...")});
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/DocumentWs.asmx/GetSharedDocumentsByCustomerId",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
						//alert("msg:\n\n" + msg);
						try {
							$.handleDocumentList(msg);
							$.unblockUI();
						} catch (loadErr) {
							alert("loading document list failed");
							$.unblockUI();
						}
                    },
                    error: function(msg) {
                        //debugger;
                        alert("Error." + msg);
						$.unblockUI();
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;
                    }
                });
		}
	};
	
	var myCoursesList = {
		customerId: "0",
		customerType: "",
		catalogSku: "",
		sortOrder: "",
		catalogSource: "",
		context: "",
		keyword: "",
		getCoursesByCustomerCatalog: function() {
				var parms = {"ApplicationCustomerId":parseInt(this.customerId),
							"ApplicationCustomerType": "\"" + this.customerType + "\"",
							"CatalogSku": "\"" + this.catalogSku + "\"",
							"SortOrder": "\"" + this.sortOrder + "\"",
							"CatalogSource": "\"" + this.catalogSource + "\"",
							"Context":"\"" + this.context + "\"",
							"filter":"\""+this.keyword.replace("\"","")+"\""
							};
				$.blockUI({message:$.setWaitMsg("Retrieving course listing...")});
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/CourseWs.asmx/GetCoursesByCustomerCatalog",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
						//alert("msg:\n\n" + msg);
						try {
							$.handleCourseList(msg);
							$.unblockUI();
						} catch (loadErr) {
							alert("loading course list failed");
							$.unblockUI();
						}
                    },
                    error: function(msg) {
                        //debugger;
                        alert("Error." + msg);
						$.unblockUI();
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;
                    }
                });
		}
	};
	
	var myCustomTrainingList = {
		keyword: "",
		customerType: "",
		customerId: "0",
		getCompanyCustomTrainingByCustomerId: function() {
				var parms = {"CustomerId":parseInt(this.customerId),"ApplicationCustomerType":"\"" + this.customerType + "\"","filter":"\"" + this.keyword + "\""};
				//alert("TESTING GetCompanyCustomTrainingByCustomerId\n\nCustomerId:" + this.customerId + "\nApplicationCustomerType:" + this.customerType + "\nfilter:" + this.keyword);
				$.blockUI({message:$.setWaitMsg("Retrieving custom training...")});
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/CustomTrainingWs.asmx/GetCompanyCustomTrainingByCustomerId",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
						//alert("msg:\n\n" + msg);
						try {
							$.handleCustomTrainingList(msg);
							$.unblockUI();
						} catch (loadErr) {
							alert("loading custom training list failed");
							$.unblockUI();
						}
                    },
                    error: function(msg) {
                        //debugger;
                        alert("Error retrieving company list by customer Id." + jQuery.parseJSON(msg));
						$.unblockUI();
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;
                    }
                });
		}
	};
	
	var mySchedules = {
		recordId: "0",
		nodeId: "",
		deleteAll: false,
		appliedScheduleFound: false,
		nodeScheduleFound: false,
		action: "",
		getAppliedSchedulesByCustomerId: function() {
				var parms = {"ApplicationCustomerId": $.trVars.appCustId,
							"ApplicationCustomerType": "\"" + $.trVars.appCustType + "\"",
							"Context": "\"" + $.trVars.appContext + "\""};
				$.blockUI({message:$.setWaitMsg("Retrieving applied schedules...")});
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/GroupWs.asmx/GetAppliedSchedulesByCustomerId",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
						//alert("msg:\n\n" + msg);
						try {
							$.handleCustomerSchedules(msg);
							$.unblockUI();
						} catch (loadErr) {
							//alert("loading schedule failed");
							$.unblockUI();
						}
                    },
                    error: function(msg) {
                        //debugger;
                        $.handleErrorMsg("Error Get Appliced By Customer." + jQuery.parseJSON(msg));
						$.unblockUI();
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;
                    }
                });
		},
		getAppliedScheduleByTreeNodeId: function() {
				var parms = {"Id":parseInt(this.recordId)};
				//alert(parms.Id);
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/GroupWs.asmx/GetAppliedScheduleByTreeNodeId",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
						//alert("return from getAppliedScheduleByTreeNodeId msg:\n\n" + msg);
						try {
							if (msg!="" && msg!="[]") {
								mySchedules.appliedScheduleFound=true;
							} else {
								mySchedules.appliedScheduleFound=false;
							}
							if (mySchedules.action=="getAppliedSchedule") $.handleAppliedSchedule(msg);
						} catch (loadErr) {
							//alert("loading schedule failed");
						}
                    },
                    error: function(msg) {
                        //debugger;
                        $.handleErrorMsg("Error Get Applied By NodeId." + jQuery.parseJSON(msg));
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;
                    }
                });
		},
		getSchedule: function() {
				var parms = {"Id":parseInt(this.recordId)};
				//alert("In getSchedule\n\n" + parms.Id);
                $.ajax({
                    url: "http://" + location.host + "/Services_LMS/GroupWs.asmx/GetSchedule",
                    global: false,
                    type: "POST",
                    cache: false,
                    data: (parms),
                    dataType: "json",
                    success: function(msg) {
						//alert("msg:\n\n" + msg);
						try {
							if (msg!="" && msg!="[]") {
								mySchedules.nodeScheduleFound=true;
							} else {
								mySchedules.nodeScheduleFound=false;
							}
							if (mySchedules.action=="getNodeSchedule") $.handleSchedule(msg);
						} catch (loadErr) {
							//alert("loading schedule failed");
						}
                    },
                    error: function(msg) {
                        //debugger;
                        $.handleErrorMsg("Error." + jQuery.parseJSON(msg));
                    },
                    complete: function() {
                        // unblock when remote call returns 
                        //debugger;
                    }
                });
		}
	};

	$.handleResellerCompanyListBox = function(str) {
		obj_page_vars.companyStr = str;
		obj_page_vars.resellerCompanyListBox = obj_listBox;
		obj_page_vars.resellerCompanyListBox.id = "resellerCompanyList";
		obj_page_vars.resellerCompanyListBox.name = "resellerCompanyList";
		obj_page_vars.resellerCompanyListBox.css = "width:300px;";
		obj_page_vars.resellerCompanyListBox.domId = "#spResellerCompany";
		obj_page_vars.resellerCompanyListBox.isLeadingOptionTag = true;
		obj_page_vars.resellerCompanyListBox.leadingOptionValue="";
		obj_page_vars.resellerCompanyListBox.leadingOptionText="-select company";
		obj_page_vars.resellerCompanyListBox.returnedString = constructCompanyListboxStr(str);
		obj_page_vars.resellerCompanyListBox.renderHtml();
		obj_page_vars.resellerCompanyListBoxBuilt = "yes";
		//attach onChange event
		$("#"+obj_page_vars.resellerCompanyListBox.id).change(function() {
			var thisVal = $("#"+obj_page_vars.resellerCompanyListBox.id).val();
			if (thisVal != "") {
				//cid=70&type=reseller&context=memberadmin.tree
				var treeObjectQS = "&cid="+thisVal+"&type=company&context="+obj_page_vars.appContext;
				document.getElementById("ifrProfile").src = '/groupTree/CompanyProfile.asp?treestate=readonly&source=tree&menu=off&id='+thisVal+treeObjectQS;
			} else {
				$(obj_page_vars.resellerCompanyListBox.domId).html("");
			}
		});
	}
	$.handleDocumentCompanyListBox = function(str) {
		obj_page_vars.companyStr = str;
		obj_page_vars.documentCompanyListBox = obj_listBox;
		obj_page_vars.documentCompanyListBox.id = "documentCompanyList";
		obj_page_vars.documentCompanyListBox.name = "documentCompanyList";
		obj_page_vars.documentCompanyListBox.css = "width:300px;";
		obj_page_vars.documentCompanyListBox.domId = "#spDocumentCompany";
		obj_page_vars.documentCompanyListBox.isLeadingOptionTag = true;
		obj_page_vars.documentCompanyListBox.leadingOptionValue="";
		obj_page_vars.documentCompanyListBox.leadingOptionText="-select company";
		if ((obj_page_vars.assetType=="Document") && ($.trVars.appCustType=="reseller")) {
			obj_page_vars.documentCompanyListBox.returnedString = $.trVars.appCustId + ":--All Documents for All Companies|" + constructCompanyListboxStr(str);
		} else {
			obj_page_vars.documentCompanyListBox.returnedString = constructCompanyListboxStr(str);
		}
		obj_page_vars.documentCompanyListBox.renderHtml();
		obj_page_vars.documentCompanyListBoxBuilt = "yes";
		//attach onChange event
		$("#"+obj_page_vars.documentCompanyListBox.id).change(function() {
			var thisVal = $("#"+obj_page_vars.documentCompanyListBox.id).val();
			if (thisVal != "") {
				if ((obj_page_vars.assetType=="Document") && ($.trVars.appCustType=="reseller") && (thisVal==$.trVars.appCustId)) { 
					//CustomTraining all courses
					myDocumentList.customerId = thisVal;
					myDocumentList.customerType = $.trVars.appCustType;
					myDocumentList.getSharedDocumentsByCustomerId();
				} else {
					myDocumentList.customerId = thisVal;
					myDocumentList.customerType = "company";
					myDocumentList.getSharedDocumentsByCustomerId();
				}
			} else {
				$("#divDocumentList").html("");
			}
		});
	}
	$.handleCustomTrainingCompanyListBox = function(str) {
		obj_page_vars.companyStr = str;
		obj_page_vars.customTrainingCompanyListBox = obj_listBox;
		obj_page_vars.customTrainingCompanyListBox.id = "customTrainingCompanyList";
		obj_page_vars.customTrainingCompanyListBox.name = "customTrainingCompanyList";
		obj_page_vars.customTrainingCompanyListBox.css = "width:300px;";
		obj_page_vars.customTrainingCompanyListBox.domId = "#spCustomTrainingCompany";
		obj_page_vars.customTrainingCompanyListBox.isLeadingOptionTag = true;
		obj_page_vars.customTrainingCompanyListBox.leadingOptionValue="";
		obj_page_vars.customTrainingCompanyListBox.leadingOptionText="-select company";
		if ((obj_page_vars.assetType=="CustomTraining") && ($.trVars.appCustType=="reseller")) {
			obj_page_vars.customTrainingCompanyListBox.returnedString = $.trVars.appCustId + ":--All Custom Training for All Companies|" + constructCompanyListboxStr(str);
		} else {
			obj_page_vars.customTrainingCompanyListBox.returnedString = constructCompanyListboxStr(str);
		}
		obj_page_vars.customTrainingCompanyListBox.renderHtml();
		obj_page_vars.customTrainingCompanyListBoxBuilt = "yes";
		//attach onChange event
		$("#"+obj_page_vars.customTrainingCompanyListBox.id).change(function() {
			var thisVal = $("#"+obj_page_vars.customTrainingCompanyListBox.id).val();
			if (thisVal != "") {
				if ((obj_page_vars.assetType=="CustomTraining") && ($.trVars.appCustType=="reseller") && (thisVal==$.trVars.appCustId)) { 
					//CustomTraining all courses
					myCustomTrainingList.customerId = thisVal;
					myCustomTrainingList.customerType = $.trVars.appCustType;
					myCustomTrainingList.getCompanyCustomTrainingByCustomerId();
				} else {
					myCustomTrainingList.customerId = thisVal;
					myCustomTrainingList.customerType = "company";
					myCustomTrainingList.getCompanyCustomTrainingByCustomerId();
				}
			} else {
				$("#divCustomTrainingList").html("");
			}
		});
	}
	$.handleMemberCompanyListBox = function(str) {
		obj_page_vars.companyStr = str;
		obj_page_vars.memberCompanyListBox = obj_listBox;
		obj_page_vars.memberCompanyListBox.id = "memberCompanyList";
		obj_page_vars.memberCompanyListBox.name = "memberCompanyList";
		obj_page_vars.memberCompanyListBox.css = "width:250px;";
		obj_page_vars.memberCompanyListBox.domId = "#spMemberCompany";
		if (obj_page_vars.memberCompanyListBoxValue!="") {
			obj_page_vars.memberCompanyListBox.selectedValue = obj_page_vars.memberCompanyListBoxValue;
		}
				//obj_page_vars.memberCompanyListBox.selectedValue = "3434,3454,3520";
				//obj_page_vars.memberCompanyListBox.isMultipleSelect = true;
				//obj_page_vars.memberCompanyListBox.multipleSize = "10";
		obj_page_vars.memberCompanyListBox.isLeadingOptionTag = true;
		obj_page_vars.memberCompanyListBox.leadingOptionValue="";
		obj_page_vars.memberCompanyListBox.leadingOptionText="-select company";
		obj_page_vars.memberCompanyListBox.returnedString = constructCompanyListboxStr(str);
		obj_page_vars.memberCompanyListBox.renderHtml();
		obj_page_vars.memberCompanyListBoxBuilt = "yes";
		obj_page_vars.memberCompanyAttributes = constructMemberCompanyAttributes(str);
		//alert(obj_page_vars.memberCompanyAttributes);
		//attach onChange event
		$("#"+obj_page_vars.memberCompanyListBox.id).change(function() {
			var thisVal = $("#"+obj_page_vars.memberCompanyListBox.id).val();
			if (thisVal != "") {
				getSearchMembers();
			} else {
				$("#divMemberList").html("");
			}
		});
	}
	function getSearchMembers() {
		if ((obj_page_vars.appCustType=="reseller")) {
			myMemberList.companyId = $("#"+obj_page_vars.memberCompanyListBox.id).val();
		} else {
			myMemberList.companyId = obj_page_vars.appCustId;
		}
		if ($("#txtMemberKeyword").val().length>0) {
			myMemberList.keyword = trimspaces($("#txtMemberKeyword").val());
		} else { myMemberList.keyword = "" };
		myMemberList.getActiveMembersByCompanyId();
		try {
			$("#spUCC").html(retrieveMemberCompanyUCC(thisVal));
		} catch(gsm1) {}
	}
	function constructCompanyListboxStr(str) {
		var returnStr = "";
		try {
			var array_co = jQuery.parseJSON(str);
			$.each(array_co, function(idx, val) {  
				returnStr += val.CompanyId + ":" + val.CompanyName + "|";
			});
			if (returnStr.length > 0) returnStr = returnStr.substr(0,returnStr.length-1);  //remove ending |
		} catch (coJson) {
			alert("parseJSON company listing failed");
			return "";
		}
		return returnStr;
	}
	function constructMemberCompanyAttributes(str) {
		var returnStr = "";
		try {
			var array_co = jQuery.parseJSON(str);
			$.each(array_co, function(idx, val) {  
				returnStr += val.CompanyId + ":" + val.UnassignedCourseCount + "|";
			});
			if (returnStr.length > 0) returnStr = returnStr.substr(0,returnStr.length-1);  //remove ending |
		} catch (coJson) {
			alert("parseJSON member company attributes failed");
			return "";
		}
		return returnStr;
	}
	function retrieveMemberCompanyUCC(compid) {
		//"2323:50|3434:99999|2324:21"
		var compArr = obj_page_vars.memberCompanyAttributes.split("|");
		var returnAttr = "0";
		$.each(compArr, function(idx, val) {  
				attrArr = val.split(":");
				foundComp = "";
				$.each(attrArr, function(idx2, val2) {
						if (idx2==0 && val2==compid) foundComp = val2;
						if (idx2==1 && foundComp==compid) returnAttr = val2;
				});
		});
		return returnAttr;
	}
	
	$.handleCompanyName = function(str) {
		var jstr = jQuery.parseJSON(str);
		obj_page_vars.companyName = jstr.CompanyName;
		$("#spMemberCompany").html("<strong>"+jstr.CompanyName+"</strong>" + "<input type=\"hidden\" id=\"memberCompanyList\" value=\""+jstr.CompanyId+"\">");
		obj_page_vars.memberCompanyName = jstr.CompanyName;
		$("#spDocumentCompany").html("<strong>"+jstr.CompanyName+"</strong>");
		obj_page_vars.documentCompanyName = jstr.CompanyName;
		$("#spCustomTrainingCompany").html("<strong>"+jstr.CompanyName+"</strong>");
		obj_page_vars.customTrainingCompanyName = jstr.CompanyName;
		obj_page_vars.companyUCC = jstr.UnassignedCourseCount;
		try {
			$("#spUCC").html("<strong>"+jstr.UnassignedCourseCount+"</strong>");
		} catch(e) {}
	}
	$.handleResellerName = function(str) {
		obj_page_vars.resellerName = str;
		//$("#divResellerIdentifier").html("<strong>"+str+"</strong>");

	}
	$.handleMemberList = function(str) {
		if (str.length>0) {
			var membersArr = str.split("|");
			var outputHtml = "<table>";
			if (membersArr.length>0) {
				for (i=0;i<membersArr.length;i++) {
						memberArr = membersArr[i].split(":");
						memberId = "";
						memberName = "";
						if ($.isArray(memberArr)) {
							memberId = memberArr[0];
							memberName = memberArr[1];
						} else {
							memberId = memberArr;
							memberName = memberArr;
						}
						outputHtml += formatMemberRow(memberId, memberName);
				}
			} else {
				$("#divMemberList").html("<span class=\"pad15\">no active members</span>");
				return false;
			}
			outputHtml += "</table>";
			$("#divMemberList").html(outputHtml);
		} else {
			$("#divMemberList").html("<span class=\"pad15\">no active members</span>");
			return false;
		}
	}
	
	$.handleDocumentList = function(str) {
		if ((str.length>0) && (str!="[]")) {
			var docsArr = str.split("|");
			var outputHtml = "<table>";
			try {
				var array_courses = jQuery.parseJSON(str);
			} catch (cJson) {
				alert("parseJSON document listing failed");
				return false;
			}
			if (array_courses.length > 0) {
				$.each(array_courses, function(idx, val) { 
					if (($.trVars.appCustType=="reseller") && ($.trVars.appCustId==$("#"+obj_page_vars.documentCompanyListBox.id).val()) ) {
						outputHtml += formatDocumentRow(val.Id, val.Title + " (" + val.CompanyName + ")");
					} else {
						outputHtml += formatDocumentRow(val.Id, val.Title);
					}
				});
			} else {
				outputHtml += "<tr><td>custom training courses not found</td></tr>";
			}
			/*
			if (docsArr.length>0) {
				for (i=0;i<docsArr.length;i++) {
						docArr = docsArr[i].split(":");
						docId = "";
						docName = "";
						if ($.isArray(docArr)) {
							docId = docArr[0];
							docName = docArr[1];
						} else {
							docId = docArr;
							docName = docArr;
						}
						outputHtml += formatDocumentRow(docId, docName);
				}
			} else {
				$("#divDocumentList").html("<span class=\"pad15\">no shared documents found</span>");
				return false;
			}
			*/
			outputHtml += "</table>";
			$("#divDocumentList").html(outputHtml);
		} else {
			$("#divDocumentList").html("<span class=\"pad15\">no shared documents found</span>");
			return false;
		}
	}
	
	$.handleCourseList = function(str) {
		if (str.length>0) {
			var outputHtml = "<table>";
			try {
				var array_courses = jQuery.parseJSON(str);
			} catch (cJson) {
				alert("parseJSON course listing failed");
				return false;
			}
			if (array_courses.length > 0) {
				$.each(array_courses, function(idx, val) { 
					if (val.Sku != "180") {  //not accident investigation
						outputHtml += formatCourseRow(val.Sku, val.Description);
					}
				});
			} else {
				outputHtml += "<tr><td>courses not found</td></tr>";
			}
			outputHtml += "</table>";
			$("#divCourseList").html(outputHtml);
			
		} else {
			$("#divCourseList").html("<span class=\"pad15\">course listing not found</span>");
			return false;
		}
	}
	$.handleCustomTrainingList = function(str) {
		if ((str.length>0) && (str!="[]")) {
			var outputHtml = "<table>";
			try {
				var array_courses = jQuery.parseJSON(str);
			} catch (cJson) {
				alert("parseJSON custom training listing failed");
				return false;
			}
			if (array_courses.length > 0) {
				$.each(array_courses, function(idx, val) { 
					if (($.trVars.appCustType=="reseller") && ($.trVars.appCustId==$("#"+obj_page_vars.customTrainingCompanyListBox.id).val()) ) {
						outputHtml += formatCustomTrainingRow(val.CourseId, val.Title + " (" + val.CompanyName + ")");
					} else {
						outputHtml += formatCustomTrainingRow(val.CourseId, val.Title);
					}
				});
			} else {
				outputHtml += "<tr><td>custom training courses not found</td></tr>";
			}
			outputHtml += "</table>";
			$("#divCustomTrainingList").html(outputHtml);
			
		} else {
			$("#divCustomTrainingList").html("<span class=\"pad15\">custom training listing not found</span>");
			return false;
		}
	}
	
	$.handleCompanyList = function(str) {
		if (str.length>0) {
			var outputHtml = "<div style=\"margin-top:5px;\">";
			try {
				var array_companies = jQuery.parseJSON(str);
			} catch (cJson) {
				alert("parseJSON course listing failed");
				return false;
			}
			$.each(array_companies, function(idx, val) {  
				outputHtml += formatCompanyRow(val.CompanyId, val.CompanyName, val.UnassignedCourseCount);
			});
			outputHtml += "<br /><div style=\"font-size:12px;width:100%;margin-left:20px;\">Note: The number in parens is remaining course tokens</div></div>"
			$("#divCompanyList").html(outputHtml);
			
		} else {
			$("#divCompanyList").html("<span class=\"pad15\">company listing not found</span>");
			return false;
		}
	}
	$.handleResellerCompanyList = function(str) {
		if (str.length>0) {
			var outputHtml = "<div style=\"margin-top:5px;\">";
			try {
				var array_companies = jQuery.parseJSON(str);
			} catch (cJson) {
				alert("parseJSON course listing failed");
				return false;
			}
			$.each(array_companies, function(idx, val) {  
				outputHtml += formatResellerCompanyRow(val.CompanyId, val.CompanyName, val.UnassignedCourseCount);
			});
			outputHtml += "<br /></div>";
			$("#divResellerCompanyList").html(outputHtml);
			
		} else {
			$("#divResellerCompanyList").html("<span class=\"pad15\">companies not found</span>");
			return false;
		}
	}
	String.prototype.repeat = function(times){ 
		var result=""; 
		var pattern=this; 
		while (times > 0) { 
			if (times&1) 
			result+=pattern; 
			times>>=1; 
			pattern+=pattern; 
		} 
		return result; 
	};
	$.handleCustomerSchedules = function(str) {
			var scheduleArr = jQuery.parseJSON(str);
			var outputStr = "&nbsp;&nbsp;&nbsp;No applied schedules found for this customer";
			var s = "-&nbsp;&nbsp;";
			if (scheduleArr.length>0) outputStr = $.trVars.tree.getItemText("1")+"<br />";
			$.each(scheduleArr, function(idx,val) {
				thisItem = val;
				thisText = $.trVars.tree.getItemText(val.NodeId);
				thisLevel = $.trVars.tree.getLevel(val.NodeId);
				thisPadding = "5";
				thisScheduleText = $.trVars.tree.getItemText(val.SchedulingNodeId);
				thisDueDate = eval(val.DueDate).defaultFormat();
				thisCycleDate = eval(val.CycleDate).defaultFormat();
				thisCycle = translateCycleText(val.Cycle);
				imgHtml = "<img src='http://grainger.safetycertified.com/groupTree/images/custom/" + $.trVars.tree.getItemImage(val.NodeId) + "' align='middle'> ";
				if (thisCycle.toLowerCase()=="fixed") thisCycle += " " + thisCycleDate;
				outputStr += "<div style='padding-left:" + thisPadding + "px;'>" + s.repeat(thisLevel) + imgHtml + thisText + 
									"<div style='padding-left:50px;'>Due Date: " + thisDueDate + "</div>" + 
									"<div style='padding-left:50px;'>Cycle: " + thisCycle + "</div>" + 
									"<div style='padding-left:50px;'>Source: " + thisScheduleText + "</div>" + "</div>";
			});
			$("#divCustomerSchedules").html(outputStr);
	/*
	{\"Id\":16954, 
	\"Cycle\":\"OneTime\", 
	\"CycleDate\":\"new Date('May 9, 2012 00:00:00')\", 
	\"DueDate\":\"new Date('May 9, 2012 00:00:00')\", 
	\"SchedulingId\":16945, 
	\"SchedulingNodeId\":\"1.1\", 
	\"NodeId\":\"1.1.1.3\"}
	*/
	}
	
	$.handleAppliedSchedule = function(str) {
		//var imgHtml = "<img src='http://grainger.safetycertified.com/groupTree/images/custom/" + $.trVars.tree.getItemImage(mySchedules.nodeId) + "' align='middle'> ";
		//$("#spAppliedNode").html(imgHtml + $.trVars.tree.getItemText(mySchedules.nodeId));
		$("#spAppliedNode").html("");
		$("#spAppliedNode").hide();
		$("#spScheduleDelete").hide();
		var schedule = jQuery.parseJSON(str);
		var cycle = "";
		var dueDate = "";
		var recurringDate = "";
		var scheduleNodeId = "";
		var scheduleText = "NA";
		$("#spAppliedDueDate").html("NA"); 
		$("#spAppliedRecurring").html("NA");
		$("#spSourceSchedule").html("NA");
		/*
		"{\"Id\":17077, 
		\"Cycle\":\"Fixed\", \
		"CycleDate\":\"new Date('January 1, 2012 00:00:00')\", 
		\"DueDate\":\"new Date('October 17, 2011 00:00:00')\", 
		\"SchedulingId\":988, 
		\"SchedulingNodeId\":\"\",  //the node of the originating schedule
		\"NodeId\":\"1.1.2.3\"}"   //this node
		*/
		if (str!="" && str!="[]") {
			try {
				recordId = schedule.Id;
				cycle = schedule.Cycle;
				dueDate = eval(schedule.DueDate);  
				recurringDate = eval(schedule.CycleDate);  
				schedulingNodeId = schedule.SchedulingNodeId; 
				if (schedulingNodeId!="") scheduleText = $.trVars.tree.getItemText(schedule.SchedulingNodeId);
				if (schedulingNodeId=="") scheduleText = $.trVars.tree.getItemText(schedule.NodeId);
				var cycleText = translateCycleText(cycle);
				if (cycle.toLowerCase()=="fixed") cycleText += " " + recurringDate.defaultFormat();
				$("#spAppliedRecurring").html(cycleText);
				$("#spSourceSchedule").html(scheduleText);
				$("#spAppliedDueDate").html(dueDate.defaultFormat());
				$("#spScheduleDelete").show();
			} catch(hasErr) {
				$("#spAppliedDueDate").html("Err");
				$("#spAppliedRecurring").html("Err");
				$("#spSourceSchedule").html("Err");
			}
		} else {
			$("#spAppliedNode").html("no schedule applies");
			$("#spAppliedNode").show();
		}
		if ($.trVars.debugMode=="on") {
			alert("IN RETURN FROM getAppliedScheduleByTreeNodeId, $.handleAppliedSchedule\n\n" + 
					"Id:" + schedule.Id + "\nSchedulingNodeId: " + schedule.SchedulingNodeId +  
					"\nDueDate:" + schedule.DueDate + "\nCycle:" + schedule.Cycle + "\nCycleDate:" + schedule.CycleDate);
		}

	}
	function translateCycleText(txt) {
		var retTxt = "";
		switch (txt.toLowerCase()) {
			case "onetime":
				retTxt = "N/A selected training is one-time "; 
				break;
			case "fixed":
				retTxt = "Annually Recurring starting on ";
				break;
			case "annuallycompleted":
				retTxt = "Annually Recurring from Training Completion Date ";
				break;
			case "semiannual":
				retTxt = "Semi-Annually Recurring (due Jan 1, July 1) ";
				break;
			case "q1_firstday":
				retTxt = "Annually Recurring on the 1st Quarter on the 1st day "
				break;
			case "q1_lastday":
				retTxt = "Annually Recurring on the 1st Quarter on the last day "
				break;
			case "q2_firstday":
				retTxt = "Annually Recurring on the 2nd Quarter on the 1st day "
				break;
			case "q2_lastday":
				retTxt = "Annually Recurring on the 2nd Quarter on the last day "
				break;
			case "q3_firstday":
				retTxt = "Annually Recurring on the 3rd Quarter on the 1st day "
				break;
			case "q3_lastday":
				retTxt = "Annually Recurring on the 3rd Quarter on the last day "
				break;
			case "q4_firstday":
				retTxt = "Annually Recurring on the 4th Quarter on the 1st day "
				break;
			case "q4_lastday":
				retTxt = "Annually Recurring on the 4th Quarter on the last day "
				break;
			case "quarterly":
				retTxt = "Annually Recurring on every quarter "
				break;
			default:
				retTxt = "N/A selected training is one-time ";  
		}
		return retTxt;
	}
	$.handleSchedule = function(str) {
		//this function formats the schedule form from the json returned from getSchedule
		if ($.trVars.debugMode=="on") alert("id:" + mySchedules.recordId + "\n\n" + str);
		var schedule = jQuery.parseJSON(str);
		if ($.trVars.debugMode=="on") {
			alert("IN RETURN FROM getSchedule, $.handleSchedule\n\nCycleId: " + schedule.CycleId + "\nCycle:" + schedule.Cycle + "\nCycleDate:" + schedule.CycleDate + "\nDueDate:" + schedule.DueDate);
			alert("CycleDate:" + eval(schedule.CycleDate) + "\nDueDate:" + eval(schedule.DueDate));
		}
		var cycle = schedule.Cycle;
		$("#radRecur1").attr("checked", "");
		$("#radRecur2").attr("checked", "");
		$("#radRecur3").attr("checked", "");
		$("#radRecur4").attr("checked", "");
		$("#radRecur5").attr("checked", "");
		$("#radRecur6").attr("checked", "");
		$("#radRecur7").attr("checked", "");
		$("#radRecur8").attr("checked", "");
		$("#radRecurQuarterly_end").attr("checked", "");
		$("#radRecurQuarterly_begin").attr("checked", "");
		$("#radRecurQtrly").attr("checked", "");
		switch (cycle.toLowerCase()) {
			case "onetime":
				$("#radRecur1").attr("checked", "checked"); 
				break;
			case "fixed":
				$("#radRecur2").attr("checked", "checked"); 
				break;
			case "annuallycompleted":
				$("#radRecur4").attr("checked", "checked"); 
				break;
			case "semiannual":
				$("#radRecur3").attr("checked", "checked"); 
				break;
			case "q1_firstday":
				$("#radRecur5").attr("checked", "checked");
				$("#radRecurQuarterly_begin").attr("checked", "checked");
				break;
			case "q1_lastday":
				$("#radRecur5").attr("checked", "checked");
				$("#radRecurQuarterly_end").attr("checked", "checked");
				break;
			case "q2_firstday":
				$("#radRecur6").attr("checked", "checked");
				$("#radRecurQuarterly_begin").attr("checked", "checked");
				break;
			case "q2_lastday":
				$("#radRecur6").attr("checked", "checked");
				$("#radRecurQuarterly_end").attr("checked", "checked");
				break;
			case "q3_firstday":
				$("#radRecur7").attr("checked", "checked");
				$("#radRecurQuarterly_begin").attr("checked", "checked");
				break;
			case "q3_lastday":
				$("#radRecur7").attr("checked", "checked");
				$("#radRecurQuarterly_end").attr("checked", "checked");
				break;
			case "q4_firstday":
				$("#radRecur8").attr("checked", "checked");
				$("#radRecurQuarterly_begin").attr("checked", "checked");
				break;
			case "q4_lastday":
				$("#radRecur8").attr("checked", "checked");
				$("#radRecurQuarterly_end").attr("checked", "checked");
				break;
			case "quarterly":
				$("#radRecurQtrly").attr("checked", "checked");
				break;
			default:
				$("#radRecur1").attr("checked", "checked"); 
		}
		var cycleDateStr = schedule.CycleDate;
		//format CycleDate
		if (cycleDateStr.length>0) {
			try {
				var cycleDate = eval(cycleDateStr);
				//alert("cycleDate:" +cycleDate);
				$("#txtRecurDate").val(cycleDate.defaultFormat());
				$("#txtRecurDate").attr("disabled", ""); 
			} catch(se1) {
				alert("Error: unable to format returned training schedule, cycle date");
			}
		} else {
			var today = new Date(); 
			$("#txtRecurDate").val(today.defaultView());
		}
		//format DueDate
		var dueDateStr = schedule.DueDate;
		if (dueDateStr.length>0) {
			try {
				var dueDate = eval(dueDateStr);
				//alert("dueDate:" +dueDate);
				$("#txtDueDate").val(dueDate.defaultFormat());
			} catch(se1) {
				alert("Error: unable to format returned training schedule, due date");
			}
		} else {
			var today = new Date(); 
			$("#txtDueDate").val(today.defaultView());
		}
	}
	
    $(document).ready(function() {
	
            $.urlPageParams = function(name) {
                var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
                if (!results) { return 0; }
                return results[1] || 0;
            }

			obj_page_vars.appCustId 	= $.urlPageParams("cid");
			obj_page_vars.appCustType 	= $.urlPageParams("type");
			obj_page_vars.appContext 	= $.urlPageParams("context");
			if (obj_page_vars.appCustType=="reseller") {
				myCompanyNames.resellerId = obj_page_vars.appCustId;
				myCompanyNames.getResellerNameForId();
			} else if (obj_page_vars.appCustType=="company") {
				myCompanyNames.companyId = obj_page_vars.appCustId;
				myCompanyNames.getCompanyNameForId();
			}
			
	});
	
	////////////////////////////////////////////////////////////////////////////////
	
	function formatMemberRow(memberId,memberName) {
		var retStr = "";
		//<div  class="pad15" style="white-space: nowrap;"><input type="checkbox" name="cbxMember" id="cbxMember1" value="22264" /> <label id="cbxMember1_lbl" for="cbxMember1">Admin, Grngr</label></div>
		retStr = "<div class=\"basicfont\" style=\"white-space: nowrap;\">" +
				"<span style=\"cursor:pointer;color:#444444;\" onclick=\"openMemberWindow("+memberId+")\"><img src=\"/groupTree/images/open_16x16.gif\" title=\"view member profile\" border=\"0\" style=\"margin-left:8px;\"></span>&nbsp;" + 
			"<input type=\"checkbox\" name=\"cbxMember\" id=\"cbxMember" + memberId + "\" value=\"" + memberId + "\" /> " +
				"<label id=\"cbxMember" + memberId + "_lbl\" for=\"cbxMember" + memberId + "\">" + memberName + "</label></div>"
		return retStr;
	}
	function formatDocumentRow(docId,docName) {
		var retStr = "";
		//<div  class="pad15" style="white-space: nowrap;"><input type="checkbox" name="cbxDocument" id="cbxDocument1" value="22264" /> <label id="cbxDocument1_lbl" for="cbxDocument1">Admin, Grngr</label></div>
		retStr = "<div class=\"basicfont\" style=\"white-space: nowrap;\">" +
					"<span style=\"cursor:pointer;color:#444444;\" onclick=\"openDocWindow("+docId+")\"><img src=\"/groupTree/images/open_16x16.gif\" title=\"open document\" border=\"0\" style=\"margin-left:8px;\"></span>&nbsp;" + 
				"<input type=\"checkbox\" name=\"cbxDocument\" id=\"cbxDocument" + docId + "\" value=\"" + docId + "\" /> " +
				"<label id=\"cbxDocument" + docId + "_lbl\" for=\"cbxDocument" + docId + "\">" + docName + "</label></div>"
		return retStr;
	}
	function formatCourseRow(sku, desc) {
	//<div  class="pad15" style="white-space: nowrap;"><input type="checkbox" name="cbxCourse" id="cbxCourse1" value="114" /> <label id="cbxCourse1_lbl" for="cbxCourse1">Access to Medical & Exposure Records</label></div>
		var retStr = "";
		retStr = "<div class=\"basicfont\" style=\"white-space: nowrap;\">" +
				"<span style=\"cursor:pointer;color:#444444;\" onclick=\"openCourseWindow("+sku+")\"><img src=\"/groupTree/images/open_16x16.gif\" title=\"view course profile\" border=\"0\" style=\"margin-left:8px;\"></span>&nbsp;" + 
				"<input type=\"checkbox\" name=\"cbxCourse\" id=\"cbxCourse" + sku + "\" value=\"" + sku + "\" /> " +
				"<label id=\"cbxCourse" + sku + "_lbl\" for=\"cbxCourse" + sku + "\">" + desc + "</label></div>"
		return retStr;
	}
	function formatCustomTrainingRow(cscid, desc) {
		var retStr = "";
		retStr = "<div class=\"basicfont\" style=\"white-space: nowrap;\">" +
				"<span style=\"cursor:pointer;color:#444444;\" onclick=\"openCustomTrainingWindow("+cscid+")\"><img src=\"/groupTree/images/open_16x16.gif\" title=\"view custom training profile\" border=\"0\" style=\"margin-left:8px;\"></span>&nbsp;" + 
				"<input type=\"checkbox\" name=\"cbxCustomTraining\" id=\"cbxCustomTraining" + cscid + "\" value=\"" + cscid + "\" /> " +
				"<label id=\"cbxCustomTraining" + cscid + "_lbl\" for=\"cbxCustomTraining" + cscid + "\">" + desc + "</label></div>";
		return retStr;
	}
	function formatCompanyRow(compId,coName, coUcc) {
		var retStr = "";
		var disableIt = "";
		retStr = "<div  class=\"basicfont\" style=\"white-space: nowrap;\">" +
					"<span style=\"cursor:pointer;color:#444444;\" onclick=\"openCompanyProfile("+compId+")\"><img src=\"/groupTree/images/open_16x16.gif\" title=\"view company profile\" border=\"0\" style=\"margin-left:8px;\"></span>&nbsp;" + 
				"<input type=\"checkbox\" name=\"cbxCompany\" id=\"cbxCompany" + compId + "\" value=\"" + compId + "\" "+disableIt+"/>" +
				"<label id=\"cbxCompany" + compId + "_lbl\" for=\"cbxCompany" + compId + "\">" + coName + "</label>&nbsp;<span style=\"color:gray;\">(" + coUcc + ")</span>&nbsp;</div>"
		return retStr;
	}
	function formatResellerCompanyRow(compId,coName, coUcc) {
		var retStr = "";
		var disableIt = "";
		retStr = "<div style=\"white-space: nowrap;\" class=\"basicfont\">" +
					"<span style=\"cursor:pointer;color:#444444;\" onclick=\"openCompanyProfile("+compId+")\"><img src=\"/groupTree/images/open_16x16.gif\" title=\"view company profile\" border=\"0\" style=\"margin-left:8px;\"></span>&nbsp;" + 
				"" + coName + "</div>"
		return retStr;
	}
	function openCompanyWindow(compId) {
		var treeObjectQS = "&cid="+compId+"&usertype="+obj_page_vars.appCustType+"&type=company&context="+obj_page_vars.appContext;
		window.open('/groupTree/CompanyProfile.asp?menu=off&id='+compId+treeObjectQS,'CompanyProfile','width=600,height=600,toolber=no,menubar=no,scrollbars,resizable');
	}
	function openCompanyWindow1() {
		if ($("#memberCompanyList").val().length>0) {
			openCompanyWindow($("#memberCompanyList").val());
			try {
				$("#spUCC").html("0");
			} catch (ocwerr) {}
		}
	}
	function openCompanyProfile(compId) {
		var treeObjectQS = "&cid="+compId+"&usertype="+obj_page_vars.appCustType+"&type=company&context="+obj_page_vars.appContext;
		document.getElementById("ifrProfile").src = '/groupTree/CompanyProfile.asp?source=resellerlist&menu=off&id='+compId+treeObjectQS;
		toggleDiv("profile");
	}
	function openCourseWindow(id) {
		var txt = $.trVars.tree.getItemText("1").replace("'","@@@");
		txt = txt.replace("&","$$$");
		window.open('/groupTree/CourseProfile.asp?source=poptree&cid='+id+'&custname='+txt,'CourseDescription','width=600,height=600,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');
	}
	function openCustomTrainingWindow(id) {
		var txt = $.trVars.tree.getItemText("1").replace("'","@@@");
		txt = txt.replace("&","$$$");
		window.open('/groupTree/CustomTrainingProfile.asp?source=poptree&cid='+id+'&custname='+txt,'CourseDescription','width=600,height=600,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');
	}
	function openDocWindow(id) {
		window.open('/groupTree/PopSharedDoc.asp?docid='+id,'SharedDocument','width=750,height=600,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');
	}
	function openMemberWindow(id) {
		window.open('/groupTree/MemberProfile.asp?id='+id,'MemberProfile','width=600,height=600,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');
	}
	function openMemberProfile(id,navoption) {
		document.getElementById("ifrProfile").src = '/groupTree/MemberProfile.asp?nav='+navoption+'&id='+id;
		toggleDiv("profile");
	}
	function openCreateTrainingUsers() {
		var companyid = myMemberList.companyId;
		window.open('/sc_admin/CreateTrainingUsers.asp?returnurl=groupTree&companyid='+companyid+'&availableseats=','CreateTrainees','width=850,height=500,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');
	}

	function getCompanyListbox4members() {
		obj_page_vars.assetType = "Member";
		if ((obj_page_vars.appCustType=="reseller") && (obj_page_vars.memberCompanyListBoxBuilt == "no")) {
			myCompanyNames.resellerId = obj_page_vars.appCustId;
			myCompanyNames.getCompanyNamesForReseller();
		} else if ((obj_page_vars.appCustType=="reseller") && (obj_page_vars.memberCompanyListBoxBuilt == "yes")) {
			getSearchMembers();
		} else if ((obj_page_vars.appCustType=="company")&& (obj_page_vars.memberCompanyListBoxBuilt == "no")) {
			myMemberList.companyId = obj_page_vars.appCustId;
			if ($("#txtMemberKeyword").val().length>0) {
				myMemberList.keyword = trimspaces($("#txtMemberKeyword").val());
			} else { myMemberList.keyword = "" };
			myMemberList.getActiveMembersByCompanyId();
			obj_page_vars.memberCompanyListBoxBuilt == "yes";
		}
	}
	function getCompanyListbox4documents() {
		obj_page_vars.assetType = "Document";
		if ((obj_page_vars.appCustType=="reseller") && (obj_page_vars.documentCompanyListBoxBuilt == "no")) {
			myCompanyNames.resellerId = obj_page_vars.appCustId;
			myCompanyNames.getCompanyNamesForReseller();
		//TODO: option here for listBoxBuilt == "yes"
		} else if ((obj_page_vars.appCustType=="company") && (obj_page_vars.documentCompanyListBoxBuilt == "no")) {
			myDocumentList.customerId = obj_page_vars.appCustId;
			myDocumentList.customerType = "company";
			myDocumentList.getSharedDocumentsByCustomerId();
			obj_page_vars.documentCompanyListBoxBuilt == "yes";
		}
	}
	function getCompanyListbox4customTraining() {
		obj_page_vars.assetType = "CustomTraining";
		if ((obj_page_vars.appCustType=="reseller") && (obj_page_vars.customTrainingCompanyListBoxBuilt == "no")) {
			myCompanyNames.resellerId = obj_page_vars.appCustId;
			myCompanyNames.getCompanyNamesForReseller();
		//TODO: option here for listBoxBuilt == "yes"
		} else if ((obj_page_vars.appCustType=="company") && (obj_page_vars.customTrainingCompanyListBoxBuilt == "no")) {
			myCustomTrainingList.customerId = obj_page_vars.appCustId;
			myCustomTrainingList.customerType = "company";
			myCustomTrainingList.keyword = "";
			myCustomTrainingList.getCompanyCustomTrainingByCustomerId();   
			obj_page_vars.customTrainingCompanyListBoxBuilt == "yes";
		}
	}
	function getCompanyListbox4reseller() {
		obj_page_vars.assetType = "Reseller";
		if ((obj_page_vars.appCustType=="reseller") && (obj_page_vars.resellerCompanyListBoxBuilt == "no")) {
			myCompanyNames.resellerId = obj_page_vars.appCustId;
			myCompanyNames.getCompanyNamesForReseller();
		} 
	}
	function getCourseListing() {
		//this is executed from the Search icon
		obj_page_vars.assetType = "Course";
		myCoursesList.customerId = obj_page_vars.appCustId;
		myCoursesList.customerType = obj_page_vars.appCustType;
		myCoursesList.catalogSku = "GR_CRS_ADMIN";
		myCoursesList.sortOrder = "";
		myCoursesList.catalogSource = "";
		myCoursesList.context = obj_page_vars.appContext;
		if ($("#txtCourseKeyword").val().length>0) {
			myCoursesList.keyword = trimspaces($("#txtCourseKeyword").val());
		} else { myCoursesList.keyword = "" };
		myCoursesList.getCoursesByCustomerCatalog();
	}
	function getCustomTrainingListing() {
		//this is executed from the Search icon
		obj_page_vars.assetType = "CustomTraining";
		//myCustomTrainingList.customerId is set in the onchange event
		if ($("#txtCustomTrainingKeyword").val().length>0) {
			myCustomTrainingList.keyword = trimspaces($("#txtCustomTrainingKeyword").val());
		} else { myCustomTrainingList.keyword = "" };
		myCustomTrainingList.getCompanyCustomTrainingByCustomerId();  
	}
	function getDocumentListing() {
		//this is executed from the Search icon
		obj_page_vars.assetType = "Document";
		//myDocumentList.customerId is set in the onchange event
		if ($("#txtDocumentKeyword").val().length>0) {
			myDocumentList.keyword = trimspaces($("#txtDocumentKeyword").val());
		} else { myDocumentList.keyword = "" };
		myDocumentList.getSharedDocumentsByCustomerId();  
	}
	function getTrainingSchedule() {
			var id = $.trVars.tree.getSelectedItemId();
			var thisId = $.getUserData(id,"Id");
			mySchedules.action = "getNodeSchedule";
			mySchedules.nodeId = id;
			mySchedules.recordId = thisId;
			mySchedules.getSchedule();
	}
	function getAppliedTrainingSchedule() {
			var id = $.trVars.tree.getSelectedItemId();
			var thisId = $.getUserData(id,"Id");
			mySchedules.action = "getAppliedSchedule";
			mySchedules.recordId = thisId;
			mySchedules.nodeId = id;
			mySchedules.getAppliedScheduleByTreeNodeId();
	}
	function getAppliedCustomerSchedules() {
			var id = $.trVars.tree.getSelectedItemId();
			var thisId = $.getUserData(id,"Id");
			mySchedules.action = "getCustomerSchedules";
			mySchedules.recordId = thisId;
			mySchedules.nodeId = id;
			mySchedules.getAppliedSchedulesByCustomerId();
	}
	function getCompanyListing() {
		obj_page_vars.assetType = "Company";
		if (obj_page_vars.appCustType=="reseller") {
			myCompanyNames.resellerId = obj_page_vars.appCustId;
			myCompanyNames.getCompanyNamesForReseller();
		}
	}
	function getResellerCompanyListing() {
		obj_page_vars.assetType = "ResellerCompany";
		if (obj_page_vars.appCustType=="reseller") {
			myCompanyNames.resellerId = obj_page_vars.appCustId;
			myCompanyNames.getCompanyNamesForReseller();
		}
	}
	function getPeopleTemplates4Select(ID) {
		myGroupTemplate.action = "getTemplates";
		myGroupTemplate.outputFormat = "listbox";
		myGroupTemplate.outputId = ID;
		myGroupTemplate.type = "Group.Member";
		myGroupTemplate.getGroupTemplates();
	}
	function getTrainingTemplates4Select(ID) {
		myGroupTemplate.action = "getTemplates";
		myGroupTemplate.outputFormat = "listbox";
		myGroupTemplate.outputId = ID;
		myGroupTemplate.type = "Group.Asset";
		myGroupTemplate.getGroupTemplates();
	}
	function refreshUCC() {
		if (obj_page_vars.appCustType=="company") {
			myCompanyNames.companyId = obj_page_vars.appCustId;
			myCompanyNames.getCompanyNameForId();
		} else if (obj_page_vars.appCustType=="reseller") {
			var origCompVal = $("#"+obj_page_vars.memberCompanyListBox.id).val();
			obj_page_vars.memberCompanyListBoxValue = origVal;
			myCompanyNames.resellerId = obj_page_vars.appCustId;
			myCompanyNames.getCompanyNamesForReseller();
			var newUCC = retrieveMemberCompanyUCC(origCompVal);
			$("#spUCC").html(newUCC);
		}
	}
