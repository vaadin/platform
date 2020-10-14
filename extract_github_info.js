const axios = require('axios');
const fs = require('fs');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));


const csvWriter = createCsvWriter({
    path: 'github_info.csv',
    header: [
	    {id: 'pullNumber', title: 'Pull Request'},
		{id: 'commitId', title: 'Commit ID'},
		{id: 'committerId', title: 'Committer ID'},
		{id: 'userName', title: 'User Name'},
	    {id: 'user', title:'User'},
		{id: 'comment', title:'Comment'},
		{id: 'commentDate', title:'Date'},
		{id: 'commentTime', title:'Time'}
		]
});

async function getRequest(pullNumber, auth){
	url='https://api.github.com/repos/vaadin/flow/pulls/'+pullNumber+'/comments'
	let res = await axios.get(url, {
		headers: {
			'User-Agent': 'flowinfo',
			'Authorization': 'token '+auth
		}
	});
	
	data = res.data;

	return data
} 

async function getRequestIssue(pullNumber, auth2){
	url='https://api.github.com/repos/vaadin/flow/issues/'+pullNumber+'/comments'
	let res = await axios.get(url, {
		headers: {
			'User-Agent': 'flowinfo',
			'Authorization': 'token '+auth2
		}
	});
	
	data = res.data;

	return data
} 

async function main(){
	if (process.argv.length = 4) {
		auth = process.argv[2];
		auth2 = process.argv[3];
    }
	pulls = fs.readFileSync('pull_number.txt').toString().split("\n");
	//console.log(pulls);
	//pulls = [100, 1000, 8765];
	for(j=0;j<pulls.length;j++){
		let records = [];
	    data = await getRequest(pulls[j],auth);
	
        for(i=0; i < data.length;i++){
		    //console.log(data[i].author_association);
		    if(data[i].author_association!='MEMBER' && data[i].author_association!='OWNER'){
			    user = 'external';
		    } else {
			    user = 'internal';
		    }
			userName =  data[i].user.login;
			if(userName!="vaadin-bot" && userName!="CLAassistant" && userName!="vaadin-tc"){
				commitId = data[i].commit_id;
		        committerId = data[i].user.id;
				committerId = require('crypto').createHash('md5').update(committerId+'').digest("hex");
				comment = data[i].body.trim();
				
				commentDateTime = data[i].created_at;
				dateTimeArray = commentDateTime.split('T');
				commentDate = dateTimeArray[0];
				commentTime = dateTimeArray[1].replace('Z','');
				//console.log(user, comment);
				record = {pullNumber: pulls[j], commitId: commitId, committerId: committerId, userName:userName, user: user, comment: comment, commentDate: commentDate, commentTime: commentTime};
				records.push(record);
			}
	    }
		
		issueData = await getRequestIssue(pulls[j],auth2);
		
		for(k=0; k<issueData.length;k++){
			if(issueData[k].author_association!='MEMBER' && issueData[k].author_association!='OWNER'){
			    user = 'external';
		    } else {
			    user = 'internal';
		    }
			
			userName =  issueData[k].user.login;
			if(userName!="vaadin-bot" && userName!="CLAassistant" && userName!="vaadin-tc"){
				commitId = "";
		        committerId = issueData[k].user.id;
				committerId = require('crypto').createHash('md5').update(committerId+'').digest("hex");
				comment = issueData[k].body.trim();
				
				commentDateTime = issueData[k].created_at;
				dateTimeArray = commentDateTime.split('T');
				commentDate = dateTimeArray[0];
				commentTime = dateTimeArray[1].replace('Z','');
				//console.log(user, comment);
				record = {pullNumber: pulls[j], commitId: commitId, committerId: committerId, userName:userName, user: user, comment: comment, commentDate: commentDate, commentTime: commentTime};
				records.push(record);
			}
		}
		
		console.log("processing Pull Request " +pulls[j] );
		await sleep(5000);
		await csvWriter.writeRecords(records);
	}
	//console.log(records);
	
	
}

main();
//git ls-remote origin 'pull/*/head' | cut -d/ -f3 > pull_number.txt