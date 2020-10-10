var PAGE_NUM_GLOBAL = 1,
    PAGE_SIZE = 20,
    PAGE_TAG = "",
    totalPages,
    totalTasks,
    taskListToRemove = [],
    toggleAll = false,
    searchResultsDataJSON = {"data": []},
    start, // Binary Sort Declarations | Start, End Page and found
    end,
    filterKey,
    found;

function GETPAGE(PAGE_NUM, PAGE_TAG) {
  return new Promise((resolve, reject) => {
    $.ajax({
      async: true,
      crossDomain: true,
      url: "https://scraper.wpic-tools.com/tasks/" + PAGE_NUM + "/" + PAGE_SIZE + "/" + PAGE_TAG,
      method: "GET",
      contentType : "application/json",
      success: (response, textStatus, jqXHR) => {
        resolve(response);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        reject(errorThrown);
      }
    });
  });
}

function POSTDELETE(index, type) {
  return new Promise((resolve, reject) => {
    var url;
    if (type == 'm')
      url = 'https://scraper.wpic-tools.com/toolkit/delete.php?id='+taskListToRemove[index];
    else if (type == 's')
      url = 'https://scraper.wpic-tools.com/toolkit/delete.php?id='+index;
    // POST Delete Tasks
    console.log(url);
    $.ajax({
      async: true,
      type: 'POST',
      url: url,
      crossDomain: true,
      dataType: 'application/json',
      success: function(responseData, textStatus, jqXHR) {
        if (type == 'm') {
          index++;
          if(taskListToRemove[index] != undefined) // If last item
            exec_queue(index);
          else { // End of list
            taskListToRemove = [];// Empty taskListToRemove[]
            getData(PAGE_NUM_GLOBAL, '', ''); // Update view model
            removeLoadBox();
          }
        }
        else {
          getData(PAGE_NUM_GLOBAL, '', ''); // Update view model
          removeLoadBox();
        }
      },
      error: function (responseData, textStatus, errorThrown) {
        console.log("POST ERROR: "+errorThrown+". Next value skipped.")
        getData(PAGE_NUM_GLOBAL, '', ''); // Update view model
      }
    });
  });
}

function getData(PAGE_NUM, foundVal, foundValType) {
  addLoadBox();
  GETPAGE(PAGE_NUM, PAGE_TAG).then(function(response) {
    fetchPageData(response, foundVal, foundValType);
    initAllObjects();
    removeLoadBox();
  });
}

/* Requests GET from scaper-tool and updates View Model */
function fetchPageData(response, foundValPass, foundValType) {
  //var somefoundvalue = '';
  console.log(response);
  /* Update global variables */
  PAGE_NUM_GLOBAL = response.page;
  totalTasks = response.total;
  totalPages = response.totalPages;
  /* Append additional filters */
  response.getKeywords = function () {
    // Get text after 'disTaskKey=' or 'q'
    var disTaskKey = new URL(this.value);
    var param = disTaskKey.searchParams.get("disTaskKey");
    if(param == "")
      return disTaskKey.searchParams.get("q");
    else
      return param;
  };
  response.activePage = function () {
    if (this == PAGE_NUM_GLOBAL)
      return 'active';
    else if (this == '0') {
      return 'disabled';
    }
  };
  response.expand = function () {
    if (this == '0')
      return '...';
    else
      return this;
  };
  response.isChecked = function () {
    /* Dynamically load selected checkboxes */
    var taskExists = false;
    for(var i=0;i<taskListToRemove.length;i++) {
      if(this.id == taskListToRemove[i]) {
        taskExists = true;
      }
    }
    if(taskExists)
      return 'checked';
    else
      return '';
  };

  // SelectAll Checked - toggleAll returns correctly, but it is across all pages, not unique to single page
  setView(response);

  // DOM has been rendered - Highlight result
  response.isHighlighted = function () {
    // Find search Result
    if(this[""+foundValType] == foundValPass) {
      return ' highlightMatch';
    }
    else
      return ''
  };

  setView(response); // Re-render view for search results
  $(".highlightMatch").removeClass("blink");
  setTimeout(function() {
    $(".highlightMatch").addClass("blink");
  }, 1);

  //console.log(totalPages);
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' ')); //.toUpperCase()
};

function setText(obj) {
  document.getElementById("searchBtn").value= "Search: "+$(obj).text();
}

function doSearch(start, end, found, filterOptionTag) {
  addLoadBox();
  var midPage = Math.floor(parseInt(start + end) / 2);

  return GETPAGE(midPage, PAGE_TAG).then(function(response) {
    var midPageData = response.data; // Search Mid Data. NOTE - Async call cannot set global variable
    var foundVal = '';
    console.log(response);

    // Search through data on page | The one binary search retrieved
    var obj = {"id" : {},"added" : {},"type" : {},"value" : {},"tag" : {},"name" : {}};
      /* Append additional filters */
    response.getKeywords = function () {
      // Get text after 'disTaskKey=' or 'q'
      var disTaskKey = new URL(this.value);
      console.log(disTaskKey);
      var param = disTaskKey.searchParams.get("disTaskKey");
      if(param == "")
        return disTaskKey.searchParams.get("q");
      else
        return param;
    };

    /* Binary search on page data */
    var startData = Object.keys(midPageData)[0];
    var endData = Object.keys(midPageData).length-1;
    var mid;

    if (filterOptionTag == 'getKeywords') {
      midPageData = response;
      console.log("This functionality has not been implemented yet.")
      removeLoadBox();
      return "Search complete";
    } else {
      // Loop through each page
      console.log(filterOptionTag);
      while (startData <= endData) {
        mid = Math.floor(parseInt(startData + endData) / 2); //(startData + (endData - startData) >> 1);
        console.log("Start data: "+startData+" ,End Data: "+endData+" ,Mid Data: "+mid);
        //console.log(filterOptionTag);
        // Search through mid page for data match
        //console.log(midPageData[mid][""+filterOptionTag].toUpperCase());

        if (filterKey === midPageData[mid][""+filterOptionTag].toUpperCase()) { // midPageData[mid][""+filterOptionTag].toUpperCase()
          found = true; // ASYNC CALL
          /* Add to found array */
          foundVal = midPageData[mid][""+filterOptionTag];
          //console.log(filterKey+" == "+response.data[midData].id.toUpperCase());
          //console.log("Response: "+response.data[midData].id.toUpperCase()+", Found (==): "+found+", Start: "+startData+", End: "+endData+" ,Mid: "+midData);
          break;
        }
        else if (filterKey > midPageData[mid][""+filterOptionTag].toUpperCase()) {
          endData = mid - 1; // set new data position index
          found = false; // ASYNC CALL
          //console.log(filterKey+" > "+response.data[midData].id.toUpperCase());
          //console.log("Response: "+response.data[midData].id.toUpperCase()+", Found (>): "+found+", Start: "+startData+", End: "+endData+" ,Mid: "+midData);
        } else {
          startData = mid + 1;
          found = false; // ASYNC CALL
          //console.log(filterKey+" < "+response.data[midData].id.toUpperCase());
          //console.log("Response: "+response.data[midData].id.toUpperCase()+", Found (<): "+found+", Start: "+startData+", End: "+endData+" ,Mid: "+midData);
        }
      }
      // Add any found values to array
      if (found) {
        console.log("Found value");
        midPageData.filter(function(dat, index) {
          // if match add to other response fields to results array
          //console.log(dat[""+filterOptionTag]);
          if (dat[""+filterOptionTag] == foundVal) { // midPageData[mid][""+filterOptionTag].toUpperCase()
            obj.id = dat.id;
            obj.added = dat.added;
            obj.type = dat.type;
            obj.value = dat.value;
            obj.tag = dat.tag;
            obj.name = dat.name;
            searchResultsDataJSON.data.splice(index, 0, obj); // Insert new object - ASYNC CALL
          }
        });
        // Change page | Renders different page
        getData(response.page, foundVal, filterOptionTag);
      }
      else { // Else update new end/start index
        console.log("Value NOT found on page: "+response.page);
        // Set start/end page indexes
        if(filterKey > midPageData[mid][""+filterOptionTag].toUpperCase()) {
          end = response.page - 1; // ASYNC CALL
        } else {
          start = response.page + 1; // ASYNC CALL
        }
        console.log("Start: "+start+", End: "+end);
      }
      console.log(searchResultsDataJSON);
      console.log("Start: "+start+", End: "+end+" ,Found: "+found);

      // Re-iterate search for new midPage value
      if (start <= end && !found) {
        // run the search operation again
        return doSearch(start, end, found, filterOptionTag);
      } else { // Otherwise end of search
        removeLoadBox();
        //tag='';
        return "Search complete";
      }
    }
  });
}

function searchBtn(override) {
  /* ONLY CHECK FOR ADD TIME AND KEYWORDS */
  // Based on filter, search through all pages
  // Fetch page with result
  var input;
  if (override == '') {
    input = document.getElementById("searchFilter");
    filterKey = input.value.toUpperCase();
  } else {
    document.getElementById("searchBtn").value= "Search: Tag";
    filterKey = override;
  }
  searchResultsDataJSON = {"data": []};

  // Initialise page search
  found = false;
  start = 1;
  end = (totalTasks / PAGE_SIZE)+1;
  console.log(end);
  if(filterKey == '') {
    getData(1, '', '');
  }
  else {
    var filterOptionTag;
    switch(document.getElementById("searchBtn").value) {
      case 'Search: ID':
        filterOptionTag = 'id';
        break;
      case 'Search: Add Time':
        filterOptionTag = 'added';
        break;
      case 'Search: Type':
        filterOptionTag = 'type';
        break;
      case 'Search: Value':
        filterOptionTag = 'value';
        break;
      case 'Search: Tag':
        filterOptionTag = 'tag';
        break;
      case 'Search: Name':
        filterOptionTag = 'name';
        break;
      case 'Search: Keywords':
        filterOptionTag = 'getKeywords';
        break;
      default:
        // Search: ID case
        filterOptionTag = 'id';
    }
    // Run page search
    doSearch(start, end, found, filterOptionTag).then(function(result) {
      // process final result
      console.log(result);
    }).catch(function(err) {
      console.log(err); // Search for value on page 2 (end page)
    });
  }
}

function setView(response) {
  setTotal(response);
  setTask(response);
  setPages(response);
}

function setTotal(response) {
  // Set element text
  $(".totalTasks").text(response.total);
}

function setTask(response) {
  //Update view model / bindings / screen render
  var tasks = $("#taskstmpl").html();
  var html1 = Mustache.to_html(tasks, response);
  $(".data-table").html(html1);
}

function setPages(response) {
  var pages = $("#pagestmpl").html();
  var html2 = Mustache.to_html(pages, response);
  $(".pages").html(html2);
}

function updatePageData(pageNum) {
    // Update view
    getData(pageNum, '', '');
    return false; // Default Browser Behaviour
}

function gotoPrevPage() {
  if(PAGE_NUM_GLOBAL > 1) {
    PAGE_NUM_GLOBAL--;
    getData(PAGE_NUM_GLOBAL, '', '');
    console.log("Previous Page: "+PAGE_NUM_GLOBAL);
  } else {
    console.log("Previous Page: "+PAGE_NUM_GLOBAL);
  }
  return false;
}

function gotoNextPage() {
  if(PAGE_NUM_GLOBAL < totalPages) {
    PAGE_NUM_GLOBAL++;

    getData(PAGE_NUM_GLOBAL, '', '');
    console.log("Next Page: "+PAGE_NUM_GLOBAL);
  }
  return false;
}

function toggleSelect(taskId) {
  var tasksOnPage = 0;
  var taskExists = taskListToRemove.find(function(element) {return element == taskId;});
  //console.log(taskExists);
  if(taskExists) {
    console.log("Removed item from list: "+taskId);
    taskListToRemove.splice(taskListToRemove.indexOf(taskId), 1);
  } else
    addSelect(taskId);
  // Select Checkboxes
  var cb = document.querySelectorAll('#toggleTask');
  cb.forEach(function(element) {
    if(element.checked) {
      tasksOnPage += 1;
      //countTasks += 1;
    }
    if(tasksOnPage == 0) {
      $('#selectAll').prop('checked', false);
      toggleAll = false;
      if(toggleAll)
        $('#selectAll').prop('checked', false);
    }
    else if(tasksOnPage == 20) {
      toggleAll = true;
      $('#selectAll').prop('checked', true);
    }
  });
  //console.log("Tasks on page: "+tasksOnPage);
  //console.log("Total tasks: "+countTasks);
}

function addSelect(taskId) {
  //Add all remaining un-selected items to list
  var taskExists = taskListToRemove.find(function(element) {return element == taskId;});
  if(taskExists) {}
  else{
    taskListToRemove.push(taskId);
  }
}

/* Dynamic Queue */
var exec_queue = function(index) {
  POSTDELETE(index, 'm').then(function(response) {
    console.log(response);
  });
}

function removeAllSelected() {
  console.log(taskListToRemove[0]);
  if(taskListToRemove[0] == undefined)
    window.alert("Please select one or more tasks");
  else {
    if(confirm("Do you really want to delete the selected tasks")) {
      //console.log("Ready to delete: " + taskListToRemove[i]);
      addLoadBox();
      var index = 0;
      exec_queue(index);
      //console.log("Deleted: "+taskListToRemove+" (Not really, this is just a test!)");
    }
    console.log(taskListToRemove);
  }
  return false; // Default Browser Behaviour
}

function removeSelect(taskId) { // Remove single item
  //console.log("Ready to delete: " + taskId);
  if(confirm("Do you really want to delete this task")) {
    addLoadBox();
    POSTDELETE(taskId, 's').then(function(response) {
      console.log(response);
    });
    //console.log("Deleted: "+taskId+" (Not really, this is just a test!)");
  }
  return false; // Default Browser Behaviour
}

function selectAll() {
  var cb, cbId;
  if (document.querySelectorAll)
    cb = document.querySelectorAll("#toggleTask");
    cbId = document.querySelectorAll("#taskId");
  if(toggleAll) {
    toggleAll = false;
    cb.forEach(function(element) {
      element.checked = false; //Unselect checkboxes
    });
    cbId.forEach(function(element) {
      toggleSelect(element.innerText); //Remove id's from list
    });
  } else {
    toggleAll = true;
    cb.forEach(function(element) {
      element.checked = true; // Select all checkboxes
    });
    cbId.forEach(function(element) {
      // Add item to list
      addSelect(element.innerText);
    });
    
  }
  console.log("Current taskListToRemove: "+taskListToRemove);
}

function clearAll() {
  getData(PAGE_NUM_GLOBAL, '', '');
}

function initAllObjects() {
  // Reset all input
  var allCheckboxes = document.querySelectorAll('input[type=checkbox]');
  [].forEach.call(allCheckboxes, function (checkbox) {
      checkbox.checked = false;
  });
  //document.getElementById("searchFilter").value = '';
}

function addLoadBox() {
  $('body').addClass('stop-scrolling');
  $(".loader-wrapper").fadeIn();
}

function removeLoadBox() {
  $('body').removeClass('stop-scrolling');
  $(".loader-wrapper").fadeOut();
}

$(document).ready(function() {
  loadMainPage().then(function(response) {
    //console.log("Done loading page");
    // Search for all data with ?tag= 'value' Filter response to have data with 'tag' in url
    // tag = getUrlParameter("tag");
    // if (tag != '') {
    //   // Do a search by tag, but instead of clicking the button you write it in the url
    //   searchBtn(tag); // Override method to custom search
    // }
  });
});

function loadMainPage() {
  return new Promise((resolve, reject) => {
    // Initial fetch data and update view
    //resolve(getData(1, '', ''));

    addLoadBox();
    tag = getUrlParameter("tag");
    if (tag != '') {
      tag = "?tag=" + tag;
      PAGE_TAG = tag;
    }
    GETPAGE(1, tag).then(function(response) {
      resolve(fetchPageData(response, '', ''));
      initAllObjects();
      removeLoadBox();
    });
  });
}

$( window ).resize(function() {
    if( $(window).width() < 768 && $(window).width() > 375){
      $('.footer').attr('style','height: 240px;left: 0;');
      $('.footer').removeClass('row');

      $('.child-1').removeClass('col-2');
      $('.child-1').addClass('row');
      $('.child-1').attr('style','padding: 5px;justify-content: center;');

      $('.child-2').removeClass('col');
      $('.child-2').addClass('row');
      $('.child-2').attr('style','padding-top: 5px;padding-right: 40px;padding-left: 40px;justify-content: center;');

      $('.child-3').removeClass('col');
      $('.child-3').addClass('row');
      $('.child-3').attr('style','padding-top: 5px, padding-bottom: 5px;padding-left: 40px;padding-right: 40px;justify-content: center;');

      $('.child-4').removeClass('col-2');
      $('.child-4').addClass('row');
      $('.child-4').attr('style','padding: 5px;justify-content: center;');
    }
    else if( $(window).width() < 375){
      $('.footer').attr('style','height: 300px;left: 0;');
      $('.footer').removeClass('row');

      $('.child-1').removeClass('col-2');
      $('.child-1').addClass('row');
      $('.child-1').attr('style','padding: 5px;justify-content: center;');

      $('.child-2').removeClass('col');
      $('.child-2').addClass('row');
      $('.child-2').attr('style','padding-top: 5px;padding-right: 40px;padding-left: 40px;justify-content: center;');

      $('.child-3').removeClass('col');
      $('.child-3').addClass('row');
      $('.child-3').attr('style','padding-top: 5px, padding-bottom: 5px;padding-left: 40px;padding-right: 40px;justify-content: center;');

      $('.child-4').removeClass('col-2');
      $('.child-4').addClass('row');
      $('.child-4').attr('style','padding: 5px;justify-content: center;');
    }
    else { // Do opposite
      $('.footer').attr('style','height: auto;');
      $('.footer').addClass('row');
      $('.footer').removeAttr('style');

      $('.child-1').addClass('col-2');
      $('.child-1').removeClass('row');
      $('.child-1').removeAttr('style');

      $('.child-2').addClass('col');
      $('.child-2').removeClass('row');
      $('.child-2').removeAttr('style');

      $('.child-3').addClass('col');
      $('.child-3').removeClass('row');
      $('.child-3').removeAttr('style');

      $('.child-4').addClass('col-2');
      $('.child-4').removeClass('row');
      $('.child-4').removeAttr('style');
    }
});