const axios = require('axios');
const fs = require('fs');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));


const csvWriter = createCsvWriter({
    path: 'github_info.csv',
    header: [
	    {id: 'pullNumber', title: 'Pull Request'},
		{id: 'commitId', title: 'Commit ID'},
		{id: 'userName', title: 'User Name'},
	    {id: 'user', title:'User'},
		{id: 'comment', title:'Comment'}
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
			if(userName!="vaadin-bot"){
				commitId = data[i].commit_id;
		
				comment = data[i].body.trim();
				//console.log(user, comment);
				record = {pullNumber: pulls[j], commitId: commitId, userName:userName, user: user, comment: comment};
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
			if(userName!="vaadin-bot"){
				commitId = "";
		
				comment = issueData[k].body.trim();
				//console.log(user, comment);
				record = {pullNumber: pulls[j], commitId: commitId, userName:userName, user: user, comment: comment};
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