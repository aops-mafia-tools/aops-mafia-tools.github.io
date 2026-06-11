// ==UserScript==
// @name         AoPS Mafia Tools
// @namespace    https://aops-mafia-tools.github.io/
// @version      3.10
// @description  Tools for the AoPS Mafia forum
// @match        https://artofproblemsolving.com/community*
// @author       cw357, Apostla
// @icon         https://artofproblemsolving.com/assets/images/favicons/online/online-favicon.ico?v=4
// @grant        MIT
// ==/UserScript==

const newVersion = await fetchVersion();
var topic_id;

setTimeout(() => {
    console.log(document.URL.match(/c(\d+)/));
    if (document.URL.match(/c(\d+)/) != null) {
    //if (document.URL.match(/c(\d+)/)[1] == "49") {
        topic_id = document.URL.match(/h(\d+)/)[1];
  if (document.getElementsByClassName("mafia-tools").length == 0){load();}
    //}
    }
}, 3000);
if (window.navigation) {
  window.navigation.addEventListener('navigate', (event) => {
    console.log('URL is changing to:', event.destination.url);

        topic_id = event.destination.url.match(/h(\d+)/)[1];
    setTimeout(() => {
    if (document.getElementsByClassName("mafia-tools").length == 0) {
  if (document.URL.match(/c(\d+)/) != null) {
    //if (document.URL.match(/c(\d+)/)[1] == "49") {
  load();
    //}
  }}
}, 1000);
  });
}

async function fetchVersion() {
    const response = await fetch('https://aops-mafia-tools.github.io/version.txt');
    const text = await response.text();
    return text.trim().split("|");
}

async function gameInfo() {
    try {
        const response = await fetch('https://aops-mafia-tools.github.io/game_status.csv');
        const csvText = await response.text();
        console.log(csvText);

        const rows = csvText.trim().split('\n');
        const output = [];
        for (const row of rows) {
            output.push(row.split(","));
        }
        console.log(output);
        return output;
    } catch (error) {
        console.error("Error processing CSV:", error);
    }
}

function parseTarget(parsed, playerList, unvote,NoElim) {
    const NoElimLower = [];
    NoElim.forEach((item, index) => {
  NoElimLower[index] = item.toLowerCase();
});
    console.log("playerlist: ");
    console.log(playerList);
    console.log(parsed);
    console.log("PARSED: " + parsed.substring(0,6).toLowerCase());
    if (unvote.includes(parsed.toLowerCase())) {
        return "N|A";
    } else if (NoElimLower.includes(parsed.toLowerCase())) {
        return "No|Hang";
    } else if (parsed.substring(0,6) != "Vote: ") {
        return "invalid|target";
    } else {
        for (const slot of playerList) {
            for (const name of slot.name) {
                console.log('name: ' + name + " parsed: " + parsed);
                if (parsed.toLowerCase().substring(6) == name.toLowerCase()) {
                    return slot.name[slot.name.length - 1];
                }
            }
        }
    }
    return "invalid|target";
}
const version = "3.10";

function gather(callback) {
    const session_id = AoPS.session.id;
    const user_id = AoPS.bootstrap_data.my_profile.user_id;
    //const topic_id = document.URL.substring(46,53);
    //const num_posts = AoPS.bootstrap_data.preload_cmty_data.topic_data.num_posts + 1;
    const num_posts = 10000000;
    const dataPayload = 'topic_id=' + topic_id + '&direction=forwards&start_post_id=-1&start_post_num=1&show_from_time=-1&num_to_fetch=' + num_posts + '&a=fetch_posts_for_topic&aops_logged_in=true&aops_user_id=' + user_id + '&aops_session_id=' + session_id;

    $.ajax({
  url: "https://artofproblemsolving.com/m/community/ajax.php",
  type: "POST",
  contentType: "application/x-www-form-urlencoded; charset=UTF-8",
  data: dataPayload,
  processData: false,
  dataType: "json"
    })
    .done(function(response, error_code) {
        console.log("Success:", response);
        console.log(error_code);
        if (error_code != 'success') {
            AoPS.Ui.Modal.showButtons("<b>AJAX FAIL</b>",[{text:'Ok',value:0}],function(){AoPS.Ui.Modal.closeAllModals();});
        } else {
            callback(response.response.posts);
        }
    })
    .fail(function(error) {
        console.error("Failed:", error);
        AoPS.Ui.Modal.showButtons("<b>AJAX FAIL</b>",[{text:'Ok',value:0}],function(){AoPS.Ui.Modal.closeAllModals();});
    });
}

function removeNested(canonical_text, openTags, closeTags) {
    const regex = /\$.*?\\phantom{.*?}.*?\$|\[.*?\]/gm;
    const bbCode = Array.from(canonical_text.matchAll(regex));
    var tipCount = 0;
    var hideCount = 0;
    var quoteCount = 0;
    var codeStart = -1;
    var codeEnd = -1;
    for (const code of bbCode) {
        console.log(code[0]);
        console.log(code.index);
        
        
        
        
        
        if (code[0].includes("phantom")) {
            
        } else if (code[0].includes("[/quote]")) {
            quoteCount--;
        } else if (code[0].includes("[quote")) {
            quoteCount++;
        } else if (code[0].includes("[/hide]")) {
            hideCount--;
        } else if (code[0].includes("[hide")) {
            hideCount++;
        } else if (code[0].includes("[/tip]")) {
            tipCount--;
        } else if (code[0].includes("[tip")) {
            tipCount++;
        }
        if ((openTags.includes(code[0])) && tipCount == 0  && hideCount == 0 && quoteCount == 0) {
            codeStart = code.index;
        }
        if ((closeTags.includes(code[0])) && tipCount == 0  && hideCount == 0 && quoteCount == 0) {
            codeEnd = code.index + code[0].length;
        }
    }
    if (codeStart != -1 && codeEnd != -1) {
        return canonical_text.substring(codeStart,codeEnd).replaceAll("\n","");
    }
    return "";
}

function quoteDepth(canonical_text) {
    const regex = /\[quote.*?\]|\[\/quote\]/gm;
    const quotes = canonical_text.match(regex);
    console.log(quotes);
    var depth = 0;
    var greatest_depth = 0;
    if (quotes == null) {
        return 0;
    } else {
        for (const quote of quotes) {
            console.log(quote);
            if (quote.includes("[quote")) {
                depth++;
                if (depth > greatest_depth) {
                    greatest_depth = depth;
                }
            } else if (quote.includes("[/quote")) {
                depth--;
            }
        }
    }
    return greatest_depth;
}

function resultsModal(title, content) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.zIndex = '99999999';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

    const modal = document.createElement('div');
    modal.style.position = 'absolute';
    modal.style.top = '20%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -20%)';
    modal.style.backgroundColor = '#fff';
    modal.style.padding = '20px';
    modal.style.borderRadius = '5px';
    modal.style.maxWidth = '90%';
    modal.style.maxHeight = '90%';
    modal.style.height = '90%';
    modal.style.width = '90%';
    modal.style.overflowY = 'auto';

    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.justifyContent = "left";
    modal.style.alignItems = "left";
    modal.style.gap = "10px";

    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    titleElement.style.marginTop = "10px";
    modal.appendChild(titleElement);

    const contentWrapper = document.createElement('div');
contentWrapper.style.flex = '1';
contentWrapper.style.overflowY = 'auto';

content.forEach(el => {
    console.log(el);
    contentWrapper.appendChild(el);
});

modal.appendChild(contentWrapper);

    const closeButton = document.createElement('button');
    closeButton.style.position = 'sticky';
    closeButton.style.alignSelf = 'flex-end';
    closeButton.style.marginRight = "0px";
    //closeButton.style.padding = '10px 20px';
    closeButton.classList.add("btn");
    closeButton.classList.add("btn-primary");
    closeButton.textContent = 'CLOSE';
    closeButton.style.zIndex = '999';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });

    const stickyFooter = document.createElement('div');
stickyFooter.style.position = 'sticky';
stickyFooter.style.bottom = '0';
stickyFooter.style.left = '0';
stickyFooter.style.right = '0';
stickyFooter.style.backgroundColor = '#fff';
stickyFooter.style.marginLeft = '-20px';
stickyFooter.style.marginRight = '-20px';
stickyFooter.style.paddingRight = "50px";
stickyFooter.style.marginBottom = '-20px';
stickyFooter.style.padding = '10px 20px';
stickyFooter.style.borderTop = '1px solid #ccc';
stickyFooter.style.display = 'flex';
stickyFooter.style.justifyContent = 'flex-end';
stickyFooter.style.zIndex = '998';

stickyFooter.appendChild(closeButton);
    modal.style.justifyContent = "space-between";
modal.appendChild(stickyFooter);
    modal.style.paddingBottom = '0px';
    modal.style.overflowX = "hidden";

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}



function iso(players, start, end) {
    
    console.log(start);
    console.log(end);
    gather(function(posts) {
        document.getElementsByClassName('cmty-topic-reply cmty-icon-w-text clickable')[0].click();
        const textArea = document.getElementsByClassName('cmty-post-textarea')[0]
        const htmlContent = [];
        for (var i = 0; i < posts.length; i++) {
            if (players.includes(posts[i].username) && posts[i].post_number >= start && posts[i].post_number <= end) {
                console.log(posts[i].post_canonical);
                console.log(quoteDepth(posts[i].post_canonical));
                const el = document.createElement('div');
                el.classList.add("cmty-post-html");
                el.style.borderBottom = "1px solid #ccc";
                if (quoteDepth(posts[i].post_canonical) < 3) {
                    textArea.value += "[quote url=/community/p" + posts[i].post_id + " name=" + posts[i].username + "]" + posts[i].post_canonical + "[/quote]\n";
                    el.innerHTML = "<div class=\'bbcode_quote\'>\n<div class=\'bbcode_quote_head\'>" + posts[i].username + " wrote:</div>\n<div class=\'bbcode_quote_body\'>" + posts[i].post_rendered + "</div>\n</div>";
                } else {
                    textArea.value += "[quote url=/community/p" + posts[i].post_id + " name=" + posts[i].username + "]" + "$\\phantom{[/quote]}$" + posts[i].post_canonical + "[/quote]\n";
                    el.innerHTML = "<div class=\'bbcode_quote\'>\n<div class=\'bbcode_quote_head\'>" + posts[i].username + " wrote:</div>\n<div class=\'bbcode_quote_body\'>" + posts[i].post_rendered + "</div>\n</div>";
                }
                htmlContent.push(el);
            }
    }
        if (htmlContent.length > 0) {
            htmlContent[htmlContent.length-1].style.borderBottom = '';
        }
        AoPS.Ui.Modal.closeAllModals();
        if (document.getElementsByClassName('iso-view-button').length > 0) {
            for (const element of document.getElementsByClassName('iso-view-button')) {
                element.remove();
            }

        }
        const button = document.createElement('button');
        button.classList.add("iso-view-button");
        button.textContent = "View ISO";
        document.getElementsByClassName('cmty-posting-environ-buttons')[0].prepend(button);
        document.getElementsByClassName('cmty-bbcode-buttons')[0].style.width = '70%';
        document.getElementsByClassName('cmty-posting-environ-buttons')[0].style.width = '29%';
        document.getElementsByClassName('iso-view-button')[0].classList.add("btn");
        document.getElementsByClassName('iso-view-button')[0].classList.add("btn-primary");
        document.getElementsByClassName('iso-view-button')[0].style.width = "80px";
        button.style.marginRight = '5px';
        button.style.padding = "-10px -10px";
        button.addEventListener('click',function(){
        resultsModal("Isolated Posts", htmlContent);
        });});

}

async function vc() {
    const info = await gameInfo();
    var lastPost;
    var validOpenTags = [];
    var validCloseTags = [];
    var unvote = "";
    var NoElim = "";
    const playerList = [];
    console.log(info);
    var noGame = true;
    for (const game of info) {
        //if (parseInt(game[0]) == AoPS.bootstrap_data.preload_cmty_data.topic_id) {
        if (parseInt(game[0]) == topic_id) {
            noGame = false;
            const slots = game[1].split("\\");
            for (const slot of slots) {
                console.log(slot);
                console.log(slot.split("/"));
                playerList.push({name: slot.split("/"), target: "N|A", post: -1, post_id: -1});
            }
            lastPost = game[2];
            validOpenTags = game[3].split("\\");
            validCloseTags = game[4].split("\\");
            unvote = game[8].toLowerCase().split("\\");
            NoElim = game[9].split("\\");
            console.log("unvote: " + unvote);
        }
    }
    console.log(validOpenTags);
    console.log(validCloseTags);
    console.log(playerList);
    console.log("last" + lastPost);
    var hammered = false;
    gather(function(posts) {
        for (var i = 0; i < posts.length && !hammered; i++) {
            const current_post = posts[i];
            if (current_post.post_number > lastPost) {
                console.log(current_post.post_canonical);
                var parsedMsg;
                if (removeNested(current_post.post_canonical,validOpenTags,validCloseTags) == "") {
                    parsedMsg = "";
                } else if (removeNested(current_post.post_canonical,validOpenTags,validCloseTags).match(/(?:])(.+)(?:\[)/) != null) {
                    parsedMsg = removeNested(current_post.post_canonical,validOpenTags,validCloseTags).match(/(?:])(.+)(?:\[)/)[1];
                } else {
                    parsedMsg = "invalid|target";
                }
                console.log(parsedMsg);
                for (const slot of playerList) {
                    if (slot.name.includes(current_post.username) && parsedMsg != "") {
                        const target = parseTarget(parsedMsg, playerList,unvote,NoElim);
                        console.log(target);
                        if (target != "invalid|target") {
                            slot.target = target;
                            slot.post = current_post.post_number;
                            slot.post_id = current_post.post_id;
                            var targetTotal = 0;
                            for (const slot1 of playerList) {
                                if (slot1.target == target) {
                                    targetTotal++;
                                }
                            }
                            if (target == "No|Hang" && targetTotal >= Math.ceil(playerList.length/2)) {
                                hammered = true;
                            } else if (target != "N|A" && targetTotal >= Math.floor(playerList.length/2)+1) {
                                hammered = true;
                            }
                        }
                    }
                }
            }
        }

        console.log(playerList);
        const voteTally = [];
        for (const slot of playerList) {
            var targetName;
            if (slot.target == "No|Hang") {
                targetName = NoElim[0].substring(6);
            } else if (slot.target == "N|A") {
                targetName = "Not Voting"
            } else {
                targetName = slot.target;
            }
            var alreadyVotes = false;
            for (const target of voteTally) {
                if (target.username == targetName) {
                    target.voters.push({voter:slot.name[slot.name.length-1],post:slot.post,post_id:slot.post_id});
                    target.count = target.count + 1;
                    alreadyVotes = true;
                }
            }
            if (!alreadyVotes) {
                voteTally.push({username: targetName, voters: [{voter:slot.name[slot.name.length-1], post: slot.post, post_id: slot.post_id}], count: 1});
            }
        }
        console.log(voteTally[0]);
        console.log(voteTally[1]);
        console.log(voteTally[2]);

        const alive = playerList.length;
        const hang = Math.floor(playerList.length/2) + 1;
        const no_hang = Math.ceil(playerList.length/2);

        var votecountHTML = "<span style='color:blue'><u>Votecount</u><br><br>";
        var votecountBBCode = "[color=#00f][u]Votecount[/u]\n\n";
        while (voteTally.length > 0) {
            var largeCount = -1;
            var largeCountIndex = 0;
            for (var i = 0; i < voteTally.length; i++) {
                if (voteTally[i].count > largeCount && voteTally[i].username != "Not Voting") {
                    largeCount = voteTally[i].count;
                    largeCountIndex = i;
                }
            }
            if (voteTally[largeCountIndex].username != "Not Voting") {
                votecountHTML += "<b>" + voteTally[largeCountIndex].username + " (" + voteTally[largeCountIndex].count;
                votecountBBCode += "[b]" + voteTally[largeCountIndex].username + " (" + voteTally[largeCountIndex].count;
            } else {
                votecountHTML += "<i>" + voteTally[largeCountIndex].username + " (" + voteTally[largeCountIndex].count;
                votecountBBCode += "[i]" + voteTally[largeCountIndex].username + " (" + voteTally[largeCountIndex].count;
            }
            if (voteTally[largeCountIndex].username != "Not Voting" && voteTally[largeCountIndex].username != NoElim[0].substring(6) && voteTally[largeCountIndex].count >= hang) {
                votecountHTML += ", HANGED):</b> ";
                votecountBBCode += ", HANGED):[/b] ";
            } else if (voteTally[largeCountIndex].username == NoElim[0].substring(6) && voteTally[largeCountIndex].count >= no_hang) {
                votecountHTML += ", HAMMERED):</b> ";
                votecountBBCode += ", HAMMERED):[/b] ";
            } else if (voteTally[largeCountIndex].username != "Not Voting") {
                votecountHTML += "):</b> ";
                votecountBBCode += "):[/b] ";
            } else {
                votecountHTML += "):</i> ";
                votecountBBCode += "):[/i] ";
            }
            var firstVoter = true;
            while (voteTally[largeCountIndex].voters.length > 0) {
                //var lowestPost = AoPS.bootstrap_data.preload_cmty_data.topic_data.num_posts + 1;
                var lowestPost = 100000000;

                var lowestPostIndex = -1;
                for (var j = 0; j < voteTally[largeCountIndex].voters.length; j++) {
                    if (voteTally[largeCountIndex].voters[j].post < lowestPost) {
                        lowestPost = voteTally[largeCountIndex].voters[j].post;
                        lowestPostIndex = j;
                    }
                }

                if (!firstVoter) {
                    votecountHTML += ", ";
                    votecountBBCode += ", "
                } else {
                    firstVoter = false;
                }

                votecountHTML += voteTally[largeCountIndex].voters[lowestPostIndex].voter;
                votecountBBCode += voteTally[largeCountIndex].voters[lowestPostIndex].voter;
                console.log(voteTally[largeCountIndex].voters[lowestPostIndex]);
                if (voteTally[largeCountIndex].voters[lowestPostIndex].post != undefined && voteTally[largeCountIndex].voters[lowestPostIndex].post != -1) {
                    votecountHTML += " (<a href=https://artofproblemsolving.com/community/p" + voteTally[largeCountIndex].voters[lowestPostIndex].post_id + ">#" + voteTally[largeCountIndex].voters[lowestPostIndex].post + "</a>)";
                    votecountBBCode += " ([url=https://artofproblemsolving.com/community/p" + voteTally[largeCountIndex].voters[lowestPostIndex].post_id + "]#" + voteTally[largeCountIndex].voters[lowestPostIndex].post + "[/url])";
                }
                voteTally[largeCountIndex].voters.splice(lowestPostIndex,1);
            }
            voteTally.splice(largeCountIndex,1);
            if (voteTally.length == 1) {
                if (voteTally[0].username == "Not Voting") {
                    votecountHTML += "<br>";
                    votecountBBCode += "\n";
                }
            }
            votecountHTML += "<br>";
            votecountBBCode += "\n";
        }
        votecountHTML += "<br>With " + alive + " alive, it takes " + hang + " to hang.</span>";
        votecountBBCode += "\nWith " + alive + " alive, it takes " + hang + " to hang.[/color]";
        console.log(votecountBBCode);
        console.log(votecountHTML);

        if (noGame) {
            votecountHTML = "<span style='color:red'><b>Not an active AoPS Mafia game.</b></span>";
            votecountBBCode = "[color=red][b]Not an active AoPS Mafia game.[/b][/color]";
        }
        AoPS.Ui.Modal.closeAllModals();

        AoPS.Ui.Modal.showButtons(votecountHTML,[{text:"EXIT", value:0},{text:"POST", value: 1}],function(value) {
            AoPS.Ui.Modal.closeAllModals();
            if (value == 1) {
                document.getElementsByClassName('cmty-topic-reply cmty-icon-w-text clickable')[0].click();
                document.getElementsByClassName('cmty-post-textarea')[0].value += votecountBBCode;
            }
        });
    });
}

async function ac() {

    const info = await gameInfo();
    gather(function(posts) {
        var ingameTime = 86400;
        var pmTime = 259200;
        var replaceTime = 345600;
        var noGame = true;
    var lastPost;
    const playerList = [];
    console.log(info);
    for (const game of info) {
        //if (parseInt(game[0]) == AoPS.bootstrap_data.preload_cmty_data.topic_id) {
        if (parseInt(game[0]) == topic_id) {
            noGame = false;
            const slots = game[1].split("\\");
            for (const slot of slots) {
                playerList.push({username:slot.split("/")[slot.split("/").length-1],time:Math.floor(Date.now()/1000) - posts[2].post_time,post:-1,post_id:-1});
            }
            lastPost = game[2];
            ingameTime = game[5];
            pmTime = game[6];
            replaceTime = game[7];
        }
    }
        console.log(noGame);
        for (const post of posts) {
            for (const player of playerList) {
                if (player.username == post.username) {
                    player.time = Math.floor(Date.now()/1000) - post.post_time;
                    player.post = post.post_number;
                    player.post_id = post.post_id;
                }
            }
        }
        var activeCount = 0;
        var ingameCount = 0;
        var pmCount = 0;
        var replaceCount = 0;
        for (const player of playerList) {
            if (player.time < ingameTime) {
                player.status = "ACTIVE";
                activeCount++;
            } else if (player.time < pmTime) {
                player.status = "INGAME";
                ingameCount++;
            } else if (player.time < replaceTime) {
                player.status = "PM";
                pmCount++;
            } else {
                player.status = "REPLACE";
                replaceCount++;
            }
        }
        var activityCheckHTML = "<span style='color:blue'><u>Activity Check</u><br><br>";
        var activityCheckBBCode = "[color=#00f][u]Activity Check[/u]\n\n";
        var firstActivity = true;

        if (activeCount > 0) {
            activityCheckHTML += "<b>Active (" + activeCount + "):</b> ";
            activityCheckBBCode += "[b]Active (" + activeCount + "):[/b] ";
            for (const player of playerList) {
                if (player.status == "ACTIVE") {
                    if (!firstActivity) {
                        activityCheckHTML += ", ";
                        activityCheckBBCode += ", ";
                    } else {
                        firstActivity = false;
                    }
                    activityCheckHTML += player.username;
                    activityCheckBBCode += player.username;
                    if (player.post != -1) {
                        activityCheckHTML += " (<a href=https://artofproblemsolving.com/community/p" + player.post_id + ">#" + player.post + "</a>)";
                        activityCheckBBCode += " ([url=https://artofproblemsolving.com/community/p" + player.post_id + "]#" + player.post + "[/url]";
                    }
                }
            }
            firstActivity = true;
            activityCheckHTML += "<br>";
            activityCheckBBCode += "\n";
        }
        if (ingameCount > 0) {
            activityCheckHTML += "<b>In-Game Prod (" + ingameCount + "):</b> ";
            activityCheckBBCode += "[b]In-Game Prod (" + ingameCount + "):[/b] ";
            for (const player of playerList) {
                if (player.status == "INGAME") {
                    if (!firstActivity) {
                        activityCheckHTML += ", ";
                        activityCheckBBCode += ", ";
                    } else {
                        firstActivity = false;
                    }
                    activityCheckHTML += player.username;
                    activityCheckBBCode += player.username;
                    if (player.post != -1) {
                        activityCheckHTML += " (<a href=https://artofproblemsolving.com/community/p" + player.post_id + ">#" + player.post + "</a>)";
                        activityCheckBBCode += " ([url=https://artofproblemsolving.com/community/p" + player.post_id + "]#" + player.post + "[/url]";
                    }
                }
            }
            firstActivity = true;
            activityCheckHTML += "<br>";
            activityCheckBBCode += "\n";
        }
        if (pmCount > 0) {
            activityCheckHTML += "<b>PM Prod (" + pmCount + "):</b> ";
            activityCheckBBCode += "[b]PM Prod (" + pmCount + "):[/b] ";
            for (const player of playerList) {
                if (player.status == "PM") {
                    if (!firstActivity) {
                        activityCheckHTML += ", ";
                        activityCheckBBCode += ", ";
                    } else {
                        firstActivity = false;
                    }
                    activityCheckHTML += player.username;
                    activityCheckBBCode += player.username;
                    if (player.post != -1) {
                        activityCheckHTML += " (<a href=https://artofproblemsolving.com/community/p" + player.post_id + ">#" + player.post + "</a>)";
                        activityCheckBBCode += " ([url=https://artofproblemsolving.com/community/p" + player.post_id + "]#" + player.post + "[/url]";
                    }
                }
            }
            firstActivity = true;
            activityCheckHTML += "<br>";
            activityCheckBBCode += "\n";
        }
        if (replaceCount > 0) {
            activityCheckHTML += "<br><b>Seeking Replacement (" + replaceCount + "):</b> ";
            activityCheckBBCode += "\n[b]Seeking Replacement (" + replaceCount + "):[/b] ";
            for (const player of playerList) {
                if (player.status == "REPLACE") {
                    if (!firstActivity) {
                        activityCheckHTML += ", ";
                        activityCheckBBCode += ", ";
                    } else {
                        firstActivity = false;
                    }
                    activityCheckHTML += player.username;
                    activityCheckBBCode += player.username;
                    if (player.post != -1) {
                        activityCheckHTML += " (<a href=https://artofproblemsolving.com/community/p" + player.post_id + ">#" + player.post + "</a>)";
                        activityCheckBBCode += " ([url=https://artofproblemsolving.com/community/p" + player.post_id + "]#" + player.post + "[/url])";
                    }
                }
            }
        }
        activityCheckHTML += "</span>";
        activityCheckBBCode += "[/color]";


        if (noGame) {
            activityCheckHTML = "<span style='color:red'><b>Not an active AoPS Mafia game.</b></span>";
            activityCheckBBCode = "[color=red][b]Not an active AoPS Mafia game.[/b][/color]";
        }
        AoPS.Ui.Modal.closeAllModals();
        AoPS.Ui.Modal.showButtons(activityCheckHTML,[{text:"EXIT", value:0},{text:"POST", value: 1}],function(value) {
            AoPS.Ui.Modal.closeAllModals();
            if (value == 1) {
                document.getElementsByClassName('cmty-topic-reply cmty-icon-w-text clickable')[0].click();
                document.getElementsByClassName('cmty-post-textarea')[0].value += activityCheckBBCode;
            }
        });
    });
}


//0123456789
//[code]lorem ipsum[/code]
function load() {
//if (AoPS.bootstrap_data.preload_cmty_data.category_id == 49) {
    const mafiaButton = document.createElement('span');
    const mafiaLabel = document.createElement('span');
    const mafiaIcon = document.createElement('span');

    mafiaLabel.textContent = " Mafia Tools";
    mafiaIcon.textContent = "y";
    mafiaIcon.classList.add("aops-icon");
    mafiaIcon.classList.add("mafia-tools");
    mafiaIcon.style.fontSize = "16px";

    mafiaButton.appendChild(mafiaIcon);
    mafiaButton.appendChild(mafiaLabel);

    mafiaButton.addEventListener('mouseenter', () => {
        mafiaButton.style.textDecoration = 'underline';
        mafiaButton.style.textDecorationThickness = "1px"
        mafiaButton.style.textUnderlineOffset = "4px";
        mafiaButton.style.cursor = 'pointer';
    });

    mafiaButton.addEventListener('mouseleave', () => {
        mafiaButton.style.textDecoration = 'none';
        mafiaButton.style.cursor = 'default';
    });

    mafiaButton.style.textUnderlineOffset = "4px";

    mafiaButton.addEventListener('click', function() {
        console.log(newVersion);
        if (newVersion[0] == version) {
            AoPS.Ui.Modal.showMessage("<b>AoPS Mafia Tools</b><br><a href='https://artofproblemsolving.com/community/c49h490304p38309976'>More info</a><br><br><button id='iso' class='btn btn-primary'><span class='aops-icon' style='font-size:15px'>t</span>  ISOLATE POSTS</button><br><button id='vc' class='btn btn-primary' style='margin-top:5px'><span class='aops-icon' style='font-size:15px'>9</span> GENERATE VOTECOUNT</button><br><button id=ac class='btn btn-primary' style='margin-top:5px'><span class='aops-icon' style='font-size:15px'>q</span> ACTIVITY CHECK</button>");
        } else {
            AoPS.Ui.Modal.showMessage("<b>AoPS Mafia Tools</b><br><a href='https://artofproblemsolving.com/community/c49h490304p38309976'>More info</a><br><br><i>* Update Available - install <a href=https://aops-mafia-tools.github.io>here</a> *<br>" + newVersion[1] + "</i><br><br><button id='iso' class='btn btn-primary'><span class='aops-icon' style='font-size:15px'>t</span>  ISOLATE POSTS</button><br><button id='vc' class='btn btn-primary' style='margin-top:5px'><span class='aops-icon' style='font-size:15px'>9</span> GENERATE VOTECOUNT</button><br><button id=ac class='btn btn-primary' style='margin-top:5px'><span class='aops-icon' style='font-size:15px'>q</span> ACTIVITY CHECK</button>");
        }
        document.getElementById('iso').addEventListener('click', function(){
            if (AoPS.bootstrap_data.user_info.logged_in == false) {
                AoPS.Ui.Modal.closeAllModals();
                AoPS.Ui.Modal.showAlert("<span style='color:red'><b>Please log in to use AoPS Mafia Tools.</b></span>");
            } else{
            AoPS.Ui.Modal.showButtons("<b><span class='aops-icon' style='font-size:15px'>t</span> ISOLATE POSTS</b><br><br>Username(s): <input type='text' id='username'></input><br>From post <input type='text' id='start'></input> to <input type='text' id='end'</input>",[{text:'ISO',value:0}],function(){iso(document.getElementById('username').value.split(','),parseInt(document.getElementById('start').value),parseInt(document.getElementById('end').value)); AoPS.Ui.Modal.closeAllModals(); AoPS.Ui.LoadingModal.show(); document.getElementsByClassName('loading-modal-frame')[0].style.scale = '50%';});
            }
        });
        document.getElementById('vc').addEventListener('click', function(){
            AoPS.Ui.Modal.closeAllModals();
            AoPS.Ui.LoadingModal.show(); document.getElementsByClassName('loading-modal-frame')[0].style.scale = '50%';
            if (AoPS.bootstrap_data.user_info.logged_in == false) {AoPS.Ui.Modal.closeAllModals();
        AoPS.Ui.Modal.showAlert("<span style='color:red'><b>Please log in to use AoPS Mafia Tools.</b></span>");
    } else {
            vc();}
        });
        document.getElementById('ac').addEventListener('click', function(){
            AoPS.Ui.Modal.closeAllModals();
            AoPS.Ui.LoadingModal.show(); document.getElementsByClassName('loading-modal-frame')[0].style.scale = '50%';
            if (AoPS.bootstrap_data.user_info.logged_in == false) {AoPS.Ui.Modal.closeAllModals();
        AoPS.Ui.Modal.showAlert("<span style='color:red'><b>Please log in to use AoPS Mafia Tools.</b></span>");
    } else
            ac();
        });
    });

    document.getElementsByClassName("cmty-topic-third-row-left")[0].style.width = '33%';
    document.getElementsByClassName("cmty-topic-third-row-right")[0].style.width = '66%';
    document.getElementsByClassName("cmty-topic-third-row-right")[0].prepend(mafiaButton);
}

