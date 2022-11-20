import { Router } from 'express';
import fs from 'fs';
import config from '../config';
import { Clip } from '../db/models/clip';
import { asyncHandler } from '../utils';
import { extname } from 'path'
import * as dotenv from 'dotenv';
import * as zlib from 'zlib'
dotenv.config();

const router = Router();

router.get('/:UUID/:filename',(req, res) =>{
    const filename:string = process.env.MEDIA_ROOT! + '/clips' + '/' + req.params.UUID + '/' + req.params.filename


    fs.exists(filename, function (exists) {
		if (!exists) {
			console.log('file not found: ' + filename);
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.write(`file not found: %s\n${filename}`);
			res.end();
		} else {
			console.log('sending file: ' + filename);
            console.log(`Finding File Extension ${extname(filename)}`)
			switch (extname(filename)) {
			case '.m3u8':
				fs.readFile(filename, function (err, contents) {
					if (err) {
						res.writeHead(500);
						res.end();
					} else if (contents) {
						res.writeHead(200,
						    {'Content-Type':'application/vnd.apple.mpegurl',
                             'Access-Control-Allow_Origin':'*'});
						// let ae = req.headers['accept-encoding'];
                        // console.log(`Encoding: ${ae}`)
						// if ( String(ae!).match(/\bgzip\b/)) {
                        //     console.log('Using gzip encoding fore some reason')
						// 	zlib.gzip(contents, function (err, zip) {
						// 		if (err) throw err;

						// 		res.writeHead(200,
						// 		    {'content-encoding': 'gzip'});
						// 		res.end(zip);
                        //         console.log('Did Encoding 1')
						// 	});
						// } else {
							res.end(contents, 'utf-8');
						// }
					} else {
						console.log('emptly playlist');
						res.writeHead(500);
						res.end();
					}
				});
				break;
			case '.ts':
				res.writeHead(200, { 'Content-Type':'video/MP2T',
                                     'Access-Control-Allow_Origin':'*' });
				var stream = fs.createReadStream(filename);
				stream.pipe(res);
				break;
			default:
				console.log('unknown file type: ' +
				    extname(filename));
				res.writeHead(500);
				res.end();
			}
		}
	});
})




export default router;