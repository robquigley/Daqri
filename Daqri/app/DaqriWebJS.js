
var __GolgiCryptoImpl = undefined;


var GolgiLib = {

        init : function(){
            // Not implemented "properly" yet
            __GolgiCryptoImpl = null;
        },

        createCryptoError : function(errText){
            var _inst = {};
            _inst.errText = errText;
            return _inst;
        },

        createHardCryptoError: function(errText){
            var err = GolgiLib.createCryptoError(errText);
            err.isHardError = true;
            return err;
        },

        createSoftCryptoError: function(errText){
            var err = GolgiLib.createCryptoError(errText);
            err.isHardError = false;
            return err;
        },

        getCryptoImpl : function(){
            return __GolgiCryptoImpl;
        },

        setCryptoImpl : function(newImpl){
            __GolgiCryptoImpl = newImpl;
        },

        escapeString : function(str){
            var result = "";
            for ( var i = 0; i < str.length; i++ ){
                var ch = str.charAt(i);
                if(ch == '\r'){
                    result += "\\r";
                }
                else if(ch == '\n'){
                    result += "\\n";
                }
                else if(ch == '\\'){
                    result += "\\\\";
                }
                else if(ch == '"'){
                    result += "\\\"";
                }
                else{
                    result += ch;
                }
            }
            return result;
        },
        deEscapeString : function(str){
            var result = "";
            var err = 0;
            var maxIdx = str.length-1;
            for ( var i = 0; i <= maxIdx; i++ ){
                var ch = str.charAt(i);
                if(ch == '\\'){
                    if(i == maxIdx){
                        err = 3;
                    }
                    else{
                        i++;
                        ch = str.charAt(i);
                        if(ch == 'r'){
                            result += "\r";
                        }
                        else if(ch == 'n'){
                            result += "\n";
                        }
                        else if(ch == '\\'){
                            result += "\\";
                        }
                        else if(ch == '"'){
                            result += "\"";
                        }
                        else{
                            err = 4;
                        }
                    }
                }
                else{
                    result += ch;
                }
            }
            if(err != 0){
                result = undefined;
            }
            return result;
        },

        encodeInt : function(tag, val){
            return "" + tag + ": " + val + "\n";
        },

        encodeString : function(tag, str){
            var result = "" + tag + ": \"";
            result += GolgiLib.escapeString(str);
            return result + "\"\n";
        },

        decodeString : function(str){
            var result = "";
            var err = 0;
            str = str.trim();
            // console.log("Asked to decode: '" + str + "'");
            if(str.length < 2){
                err = 1;
            }
            else if(str.charAt(0) != '"' || str.charAt(str.length-1) != '"'){
                err = 2;
            }
            else{
                result = GolgiLib.deEscapeString(str.substr(1, str.length-2));
            }
            if(err != 0){
                console.log("Error Decoding String: " + err + " for '" + str + "'");
                result = undefined;
            }
            return result;
        },
        
        genJSONTag : function(tag){
            var result = "\"" + tag + "\":";
            return result;
        },
        
        encodeJSString : function(str){
            var result = "\"";
            for ( var i = 0; i < str.length; i++ ){
                var ch = str.charAt(i);
                if(ch == '\"'){
                    result += "\\\"";
                }
                else if(ch == '\\'){
                    result += "\\\\";
                }
                else if(ch == '/'){
                    result += "\\/";
                }
                else if(ch == '\b'){
                    result += "\\b";
                }
                else if(ch == '\f'){
                    result += "\\f";
                }
                else if(ch == '\n'){
                    result += "\\n";
                }
                else if(ch == '\r'){
                    result += "\\r";
                }
                else if(ch == '\t'){
                    result += "\\t";
                }
                else{
                    result += ch;
                }
            }
            result += "\"";
            
            return result;
        },
        

        

        Payload : function(inputLines){
            var _inst = {};
            var fieldHash = {};
            var nestedHash = {};
            var listHash = {}
            var lines = [];
            var corrupt = false;

            _inst.isCorrupt = function(){
                return corrupt;
            }

            _inst.dump = function(indent){
                if(indent == undefined) indent = 0;
                var indentStr = "";
                var str = "";

                for(var i = 0; i < indent; i++){
                    indentStr = indentStr + "    ";
                }

                var keys = Object.keys(fieldHash);
                if(keys.length > 0){
                    console.log(indentStr + "There are " + keys.length + " standard fields:");
                    for(var i = 0; i < keys.length; i++){
                        console.log(indentStr + i + "-> {" + keys[i] + "} => '" + fieldHash[keys[i]] + "'");
                    }
                }

                var keys = Object.keys(nestedHash);
                if(keys.length > 0){
                    console.log(indentStr + "There are " + keys.length + " nested fields");
                    for(var i = 0; i < keys.length; i++){
                        console.log(indentStr + i + "-> {" + keys[i] + "}:");
                        nestedHash[keys[i]].dump(indent+1);
                    }
                }

                var keys = Object.keys(listHash);
                if(keys.length > 0){
                    console.log(indentStr + "There are " + keys.length + " list fields");
                    for(var i = 0; i < keys.length; i++){
                        console.log(indentStr + i + "-> {" + keys[i] + "}:");
                        listHash[keys[i]].dump(indent+1);
                    }
                }
            }

            _inst.getLineForKey = function(key){
                return fieldHash[key];
            }

            _inst.getListLineForKey = function(key, idx){
                return fieldHash[key + ".[" + idx + "]"];
            }

            _inst.getNestedForKey = function(key){
                return nestedHash[key];
            }

            _inst.getListNestedForKey = function(key, idx){
                // console.log("getListNestedForKey: '" + key + "' " + idx +": " + listHash[key + ".[" + idx + "]"]);

                return listHash[key + ".[" + idx + "]"];
            }

            _inst.addLine = function(line){
                var err = 0;
                line = line.trim();
                lines.push(line);
                var idx = line.indexOf(':');
                if(idx <= 0){
                    err++;
                }
                else{
                    var key = line.substr(0,idx);
                    var val = (line.substr(idx+1)).trim();
                    var dotIdx = key.indexOf('.');
                    var lbIdx = key.indexOf('.[');
                    var rbIdx = key.indexOf(']');
                    var rbnIdx = key.indexOf('].');

                    if(dotIdx < 0){
                        //
                        // Simple field
                        //
                        fieldHash[key] = val;
                    }
                    else if(rbIdx == (key.length - 1)){
                        //
                        // List of integrals
                        //
                        fieldHash[key] = val;
                    }
                    else if(dotIdx > 0 && (lbIdx < 0 || lbIdx > dotIdx)){
                        //
                        // A nested type
                        //
                        key = key.substr(0, dotIdx);
                        var nestedPayload = nestedHash[key];  
                        if(nestedPayload == undefined){
                            nestedPayload = GolgiLib.Payload();
                            nestedHash[key] = nestedPayload;
                        }
                        nestedPayload.addLine(line.substr(dotIdx+1));
                    }
                    else if(lbIdx > 0 && rbnIdx > 0){
                        //
                        // A List of Nested Types
                        //
                        key = key.substr(0, rbnIdx+1);
                        var listPayload = listHash[key];  
                        if(listPayload == undefined){
                            listPayload = GolgiLib.Payload();
                            listHash[key] = listPayload;
                        }
                        listPayload.addLine(line.substr(rbnIdx+2));
                    }
                    else{
                        err++;
                    }
                }
                if(err != 0){
                    _inst.corrupt = true;
                }
                return err;
            }

            if(inputLines != undefined){
                var l = inputLines.split("\n");
                for(var i = 0; i < l.length && corrupt == false; i++){
                    _inst.addLine(l[i]);
                }
            }
            return _inst;
        },
    
    // The B64 code below is originally from http://jsbase64.codeplex.com/
    // It has been modified to work with Uint8Array
    // as input to encode() and Uint8Array as output from decode()
    /*
    Copyright Vassilis Petroulias [DRDigit]

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

           http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
    */
    B64 :  {
        alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
        lookup: null,
        ie : false,
        // ie: /MSIE /.test(navigator.userAgent),
        // ieo: /MSIE [67]/.test(navigator.userAgent),
        encode: function (buffer) {
            var position = -1,
                len = buffer.length,
                nan0, nan1, nan2, enc = [, , , ];
            if (GolgiLib.B64.ie) {
                var result = [];
                while (++position < len) {
                    nan0 = buffer[position];
                    nan1 = buffer[++position];
                    enc[0] = nan0 >> 2;
                    enc[1] = ((nan0 & 3) << 4) | (nan1 >> 4);
                    if (isNaN(nan1))
                        enc[2] = enc[3] = 64;
                    else {
                        nan2 = buffer[++position];
                        enc[2] = ((nan1 & 15) << 2) | (nan2 >> 6);
                        enc[3] = (isNaN(nan2)) ? 64 : nan2 & 63;
                    }
                    result.push(GolgiLib.B64.alphabet.charAt(enc[0]), GolgiLib.B64.alphabet.charAt(enc[1]), GolgiLib.B64.alphabet.charAt(enc[2]), GolgiLib.B64.alphabet.charAt(enc[3]));
                }
                return result.join('');
            } else {
                var result = '';
                while (++position < len) {
                    nan0 = buffer[position];
                    nan1 = buffer[++position];
                    enc[0] = nan0 >> 2;
                    enc[1] = ((nan0 & 3) << 4) | (nan1 >> 4);
                    if (isNaN(nan1))
                        enc[2] = enc[3] = 64;
                    else {
                        nan2 = buffer[++position];
                        enc[2] = ((nan1 & 15) << 2) | (nan2 >> 6);
                        enc[3] = (isNaN(nan2)) ? 64 : nan2 & 63;
                    }
                    result += GolgiLib.B64.alphabet[enc[0]] + GolgiLib.B64.alphabet[enc[1]] + GolgiLib.B64.alphabet[enc[2]] + GolgiLib.B64.alphabet[enc[3]];
                }
                return result;
            }
        },
        decode: function (s) {
            if (s.length % 4){
                return undefined;
            }
            var position = -1,
                widx,
                len, buffer,
                enc = [, , , ];
            if (!GolgiLib.B64.lookup) {
                len = GolgiLib.B64.alphabet.length;
                GolgiLib.B64.lookup = {};
                while (++position < len)
                    GolgiLib.B64.lookup[GolgiLib.B64.alphabet.charAt(position)] = position;
                position = -1;
            }
            len = s.length;
            buffer = new Uint8Array(len);
            widx = 0;
            while (++position < len) {
            	// console.log("Decode: '" + s.charAt(position) + "' '" + s.charAt(position+1) + "' '" + s.charAt(position+2) + "' '" + s.charAt(position+3) + "'");
                enc[0] = GolgiLib.B64.lookup[s.charAt(position)];
                enc[1] = GolgiLib.B64.lookup[s.charAt(++position)];
                buffer[widx++] = (enc[0] << 2) | (enc[1] >> 4);
                enc[2] = GolgiLib.B64.lookup[s.charAt(++position)];
                if (enc[2] == 64)
                    break;
                buffer[widx++] = ((enc[1] & 15) << 4) | (enc[2] >> 2);
                enc[3] = GolgiLib.B64.lookup[s.charAt(++position)];
                if (enc[3] == 64)
                    break;
                buffer[widx++] = ((enc[2] & 3) << 6) | enc[3];
            }
            var result = new Uint8Array(widx);
            result.set(buffer.subarray(0,widx));
            return result;
        },

    },
    encodeDouble : function(value){
    	var exponent = 1;
    	var	mantissa = 0.0;

    	if (value == 0 || value == -0) {
    	}
        else if(isNaN(value)) {
            mantissa = 0.0;
            exponent = 0;
        }
    	else if (value == Infinity || value == -Infinity){
    		mantissa = value;
    		exponent = -1;
    	}
    	else{
    		mantissa = value;
    		exponent = 0;
    		var sign = 1;

    		if (mantissa < 0) {
    			sign = -1;
    			mantissa = -mantissa;
    		}
    		while (mantissa < 0.5) {
    			mantissa *= 2.0;
    			exponent -= 1;
    		}
    		while (mantissa >= 1.0) {
    			mantissa *= 0.5;
    			exponent++;
    		}
    		mantissa *= sign;
    	}
    	var str = mantissa.toPrecision(15);
    	str = str.replace(/0*$/, "");
    	return str + " E" + exponent;
    },
    decodeDouble : function(str){
    	// console.log("Asked to decode '" + str + "'");
    	var eIdx = str.indexOf(" E");
    	var result = NaN;
    	if(eIdx > 0){
    		var mStr = str.substr(0,eIdx);
    		var eStr = str.substr(eIdx+2);
    		
    		// console.log("Mantissa: '" + mStr + "'");
    		// console.log("Exponent: '" + eStr + "'");

            var mantissa = parseFloat(mStr);
            var exponent = parseInt(eStr);
            if(mantissa != NaN && exponent != NaN){
            	if(exponent >= 0){
            		result = mantissa*(Math.pow(2.0, exponent));
            	}
            	else{
            		result = mantissa / Math.pow(2.0, -exponent);
            	}
            }
    	}
    	return result;
    },
    
    encodeData : function(data){
    	return "[" + GolgiLib.B64.encode(data) + "]";    	
    },
    
    decodeData : function(str){
    	var result;
    	var err = 0;
    	str = str.trim();
    	// console.log("Asked to decode: '" + str + "'");
    	if(str.length < 2){
    		err = 1;
    	}
    	else if(str.charAt(0) != '[' || str.charAt(str.length-1) != ']'){
    		err = 2;
    	}
    	else{
    		result = GolgiLib.B64.decode(str.substr(1, str.length-2));
    	}
    	return result;
    },
    
    GolgiMessage : function(){
    	var _inst = {};
    	_inst.dev_key = "";
    	_inst.api_key = "";
    	_inst.oa_app_user_id = "";
    	_inst.da_app_user_id = "";
    	_inst.message_id = "";
    	_inst.msg_type = 0;
    	_inst.method = "";
    	_inst.err_type = 0;
    	_inst.err_txt = "";
    	_inst.payload = "";
    	_inst.options = undefined;
    	
    	_inst.dupe = function(){
    		return Object.create(_inst);
    	}
    	
    	_inst.serialise = function(){
    		var str = "";
    		str += "dev_key: \"" + GolgiLib.escapeString(_inst.dev_key) + "\"\n";
    		str += "api_key: \"" + GolgiLib.escapeString(_inst.api_key) + "\"\n";
    		str += "oa_app_user_id: \"" + GolgiLib.escapeString(_inst.oa_app_user_id) + "\"\n";
    		str += "da_app_user_id: \"" + GolgiLib.escapeString(_inst.da_app_user_id) + "\"\n";
    		str += "message_id: \"" + GolgiLib.escapeString(_inst.message_id) + "\"\n";
    		str += "msg_type: " + _inst.msg_type + "\n"; // (0 => REQ) (1 => RSP) (2 => ERR) 
    		str += "method: \"" + GolgiLib.escapeString(_inst.method) + "\"\n";
    		str += "err_type: " + _inst.err_type + "\n";
    		str += "err_txt: \"" + GolgiLib.escapeString(_inst.err_txt) + "\"\n";
    		str += "payload: \"" + GolgiLib.escapeString(_inst.payload) + "\"\n";
    		if(_inst.options != undefined){
    			var keys = Object.keys(_inst.options);
    			if(keys.length > 0){
    				for(var i = 0; i < keys.length; i++){
    					var key = keys[i];
    					var val = _inst.options[key];
    					var idx = "" + i;
    					if(i < 100){
    						idx = "000".substr(idx.length) + idx;
    					}
    					str += "options." + idx + ".key: \"" + GolgiLib.escapeString(key) + "\"\n";
    					str += "options." + idx + ".value: \"" + GolgiLib.escapeString("" + val) + "\"\n";
    				}
				}
			}
    		return str;
		}
    	_inst.deserialise = function(payload){
    		var typeHash = {
    				'dev_key' : 's',
    				'api_key' : 's',
    				'oa_app_user_id' : 's',
    				'da_app_user_id' : 's',
    				'message_id' : 's',
    				'msg_type' : 'i',
    				'method' : 's',
    				'err_type' : 'i',
    				'err_txt' : 's',
    				'payload' : 's', 
    		};
    		
			var lines = payload.split("\n");
			var kvHash = {};
			var err = 0;
			for(var i = 0; i < lines.length; i++){
				var l = lines[i].trim();
				var idx = l.indexOf(": ");
				if(idx > 0){
					var key = l.substr(0, idx).toLowerCase();
					var val = l.substr(idx+2).trim();
					kvHash[key] = val;
					// console.log("KEY: '" + key + "' VALUE: '" + val + "'");
				}
			}
			
			var keys = Object.keys(typeHash);
			for(var i = 0; i < keys.length; i++){
				var key = keys[i]
				var val = kvHash[key];
				if(val == undefined){
					err++;
				}
				else if(typeHash[key] == 's'){
					var sval = GolgiLib.decodeString(val);
					if(sval == undefined){
						err++;
					}
					else{
						_inst[key] = sval;
					}
				}
				else if(typeHash[key] == 'i'){
					var ival = parseInt(val);
					if(isNaN(ival)){
						err++;
					}
					else{
						_inst[key] = ival;
					}
				}
				else{
					err++;
				}
			}
			
			_inst.options = {};
			
			for(var i = 0; true; i++){
				var idx = "" + i;
				if(i < 100){
					idx = "000".substr(idx.length) + idx;
				}
				var optag =  "options." + idx;
				var key = kvHash[optag + ".key"];
				var val = kvHash[optag + ".value"];
				
				if(key == undefined || val == undefined){
					break;
				}
				key = GolgiLib.decodeString(key);
				val = GolgiLib.decodeString(val);
				if(key == undefined || val == undefined){
					err++;
					break;
				}
				_inst.options[key] = val;
			}
			
			
			return err;
    	};
    	return _inst;
    },
};

var GolgiCryptoException = function(_errText, _hardException){
	var _inst = {};
	
	var errText = "";
	var hardException = false;
	
	if(_errText != undefined){
		errText = _errText;
	}
	
	if(_hardException != undefined){
		if(_hardException){
			hardException = true;
		}
		else{
			hardException = false;
		}
	}
	
	
	_inst.isHardException = function(){
		return hardException;
	}
	_inst.isSoftException = function(){
		return !hardException;
	}
	
	_inst.getErrText = function(){
		return errText;
	}

	return _inst;
};



//
// Javascript Implementation of Blowfish taken and modified
// (legally as I read it) from:
//
// http://etherhack.co.uk/symmetric/blowfish/js/blowfish.js
//


/*
JavaScript encryption module ver. 2.0 by Daniel Rench

Based on existing code:
Copyright (c) 2003 by Andre Mueller.
Init of blowfish constants with a function (init/backup errors)
Copyright (c) 2003 by Rainer Wollmann
This Object is open source. You can redistribute it and/or modify
it under the terms of the Universal General Public License (UGPL).
http://www.ugpl.de/

2009-Mar-24 decrypt function modified by Tim Stamp to convert all
hexadecimal input to uppercase - if lowercase hex is input the
ciphertext is incorrectly decoded.

*/

var Blowfish = function(){
	var _inst = {};
	
	_inst.encCount = 0;
	_inst.decCount = 0;
	
	_inst.Fbf_P=function(){
		return [
		        0x243f6a88,0x85a308d3,0x13198a2e,0x03707344,0xa4093822,0x299f31d0,
		        0x082efa98,0xec4e6c89,0x452821e6,0x38d01377,0xbe5466cf,0x34e90c6c,
		        0xc0ac29b7,0xc97c50dd,0x3f84d5b5,0xb5470917,0x9216d5d9,0x8979fb1b
		        ];
	};
	_inst.Fbf_S0=function(){
		return [
		        0xd1310ba6,0x98dfb5ac,0x2ffd72db,0xd01adfb7,0xb8e1afed,0x6a267e96,
		        0xba7c9045,0xf12c7f99,0x24a19947,0xb3916cf7,0x0801f2e2,0x858efc16,
		        0x636920d8,0x71574e69,0xa458fea3,0xf4933d7e,0x0d95748f,0x728eb658,
		        0x718bcd58,0x82154aee,0x7b54a41d,0xc25a59b5,0x9c30d539,0x2af26013,
		        0xc5d1b023,0x286085f0,0xca417918,0xb8db38ef,0x8e79dcb0,0x603a180e,
		        0x6c9e0e8b,0xb01e8a3e,0xd71577c1,0xbd314b27,0x78af2fda,0x55605c60,
		        0xe65525f3,0xaa55ab94,0x57489862,0x63e81440,0x55ca396a,0x2aab10b6,
		        0xb4cc5c34,0x1141e8ce,0xa15486af,0x7c72e993,0xb3ee1411,0x636fbc2a,
		        0x2ba9c55d,0x741831f6,0xce5c3e16,0x9b87931e,0xafd6ba33,0x6c24cf5c,
		        0x7a325381,0x28958677,0x3b8f4898,0x6b4bb9af,0xc4bfe81b,0x66282193,
		        0x61d809cc,0xfb21a991,0x487cac60,0x5dec8032,0xef845d5d,0xe98575b1,
		        0xdc262302,0xeb651b88,0x23893e81,0xd396acc5,0x0f6d6ff3,0x83f44239,
		        0x2e0b4482,0xa4842004,0x69c8f04a,0x9e1f9b5e,0x21c66842,0xf6e96c9a,
		        0x670c9c61,0xabd388f0,0x6a51a0d2,0xd8542f68,0x960fa728,0xab5133a3,
		        0x6eef0b6c,0x137a3be4,0xba3bf050,0x7efb2a98,0xa1f1651d,0x39af0176,
		        0x66ca593e,0x82430e88,0x8cee8619,0x456f9fb4,0x7d84a5c3,0x3b8b5ebe,
		        0xe06f75d8,0x85c12073,0x401a449f,0x56c16aa6,0x4ed3aa62,0x363f7706,
		        0x1bfedf72,0x429b023d,0x37d0d724,0xd00a1248,0xdb0fead3,0x49f1c09b,
		        0x075372c9,0x80991b7b,0x25d479d8,0xf6e8def7,0xe3fe501a,0xb6794c3b,
		        0x976ce0bd,0x04c006ba,0xc1a94fb6,0x409f60c4,0x5e5c9ec2,0x196a2463,
		        0x68fb6faf,0x3e6c53b5,0x1339b2eb,0x3b52ec6f,0x6dfc511f,0x9b30952c,
		        0xcc814544,0xaf5ebd09,0xbee3d004,0xde334afd,0x660f2807,0x192e4bb3,
		        0xc0cba857,0x45c8740f,0xd20b5f39,0xb9d3fbdb,0x5579c0bd,0x1a60320a,
		        0xd6a100c6,0x402c7279,0x679f25fe,0xfb1fa3cc,0x8ea5e9f8,0xdb3222f8,
		        0x3c7516df,0xfd616b15,0x2f501ec8,0xad0552ab,0x323db5fa,0xfd238760,
		        0x53317b48,0x3e00df82,0x9e5c57bb,0xca6f8ca0,0x1a87562e,0xdf1769db,
		        0xd542a8f6,0x287effc3,0xac6732c6,0x8c4f5573,0x695b27b0,0xbbca58c8,
		        0xe1ffa35d,0xb8f011a0,0x10fa3d98,0xfd2183b8,0x4afcb56c,0x2dd1d35b,
		        0x9a53e479,0xb6f84565,0xd28e49bc,0x4bfb9790,0xe1ddf2da,0xa4cb7e33,
		        0x62fb1341,0xcee4c6e8,0xef20cada,0x36774c01,0xd07e9efe,0x2bf11fb4,
		        0x95dbda4d,0xae909198,0xeaad8e71,0x6b93d5a0,0xd08ed1d0,0xafc725e0,
		        0x8e3c5b2f,0x8e7594b7,0x8ff6e2fb,0xf2122b64,0x8888b812,0x900df01c,
		        0x4fad5ea0,0x688fc31c,0xd1cff191,0xb3a8c1ad,0x2f2f2218,0xbe0e1777,
		        0xea752dfe,0x8b021fa1,0xe5a0cc0f,0xb56f74e8,0x18acf3d6,0xce89e299,
		        0xb4a84fe0,0xfd13e0b7,0x7cc43b81,0xd2ada8d9,0x165fa266,0x80957705,
		        0x93cc7314,0x211a1477,0xe6ad2065,0x77b5fa86,0xc75442f5,0xfb9d35cf,
		        0xebcdaf0c,0x7b3e89a0,0xd6411bd3,0xae1e7e49,0x00250e2d,0x2071b35e,
		        0x226800bb,0x57b8e0af,0x2464369b,0xf009b91e,0x5563911d,0x59dfa6aa,
		        0x78c14389,0xd95a537f,0x207d5ba2,0x02e5b9c5,0x83260376,0x6295cfa9,
		        0x11c81968,0x4e734a41,0xb3472dca,0x7b14a94a,0x1b510052,0x9a532915,
		        0xd60f573f,0xbc9bc6e4,0x2b60a476,0x81e67400,0x08ba6fb5,0x571be91f,
		        0xf296ec6b,0x2a0dd915,0xb6636521,0xe7b9f9b6,0xff34052e,0xc5855664,
		        0x53b02d5d,0xa99f8fa1,0x08ba4799,0x6e85076a
		        ];
	};
	_inst.Fbf_S1=function(){
		return [
		        0x4b7a70e9,0xb5b32944,0xdb75092e,0xc4192623,0xad6ea6b0,0x49a7df7d,
		        0x9cee60b8,0x8fedb266,0xecaa8c71,0x699a17ff,0x5664526c,0xc2b19ee1,
		        0x193602a5,0x75094c29,0xa0591340,0xe4183a3e,0x3f54989a,0x5b429d65,
		        0x6b8fe4d6,0x99f73fd6,0xa1d29c07,0xefe830f5,0x4d2d38e6,0xf0255dc1,
		        0x4cdd2086,0x8470eb26,0x6382e9c6,0x021ecc5e,0x09686b3f,0x3ebaefc9,
		        0x3c971814,0x6b6a70a1,0x687f3584,0x52a0e286,0xb79c5305,0xaa500737,
		        0x3e07841c,0x7fdeae5c,0x8e7d44ec,0x5716f2b8,0xb03ada37,0xf0500c0d,
		        0xf01c1f04,0x0200b3ff,0xae0cf51a,0x3cb574b2,0x25837a58,0xdc0921bd,
		        0xd19113f9,0x7ca92ff6,0x94324773,0x22f54701,0x3ae5e581,0x37c2dadc,
		        0xc8b57634,0x9af3dda7,0xa9446146,0x0fd0030e,0xecc8c73e,0xa4751e41,
		        0xe238cd99,0x3bea0e2f,0x3280bba1,0x183eb331,0x4e548b38,0x4f6db908,
		        0x6f420d03,0xf60a04bf,0x2cb81290,0x24977c79,0x5679b072,0xbcaf89af,
		        0xde9a771f,0xd9930810,0xb38bae12,0xdccf3f2e,0x5512721f,0x2e6b7124,
		        0x501adde6,0x9f84cd87,0x7a584718,0x7408da17,0xbc9f9abc,0xe94b7d8c,
		        0xec7aec3a,0xdb851dfa,0x63094366,0xc464c3d2,0xef1c1847,0x3215d908,
		        0xdd433b37,0x24c2ba16,0x12a14d43,0x2a65c451,0x50940002,0x133ae4dd,
		        0x71dff89e,0x10314e55,0x81ac77d6,0x5f11199b,0x043556f1,0xd7a3c76b,
		        0x3c11183b,0x5924a509,0xf28fe6ed,0x97f1fbfa,0x9ebabf2c,0x1e153c6e,
		        0x86e34570,0xeae96fb1,0x860e5e0a,0x5a3e2ab3,0x771fe71c,0x4e3d06fa,
		        0x2965dcb9,0x99e71d0f,0x803e89d6,0x5266c825,0x2e4cc978,0x9c10b36a,
		        0xc6150eba,0x94e2ea78,0xa5fc3c53,0x1e0a2df4,0xf2f74ea7,0x361d2b3d,
		        0x1939260f,0x19c27960,0x5223a708,0xf71312b6,0xebadfe6e,0xeac31f66,
		        0xe3bc4595,0xa67bc883,0xb17f37d1,0x018cff28,0xc332ddef,0xbe6c5aa5,
		        0x65582185,0x68ab9802,0xeecea50f,0xdb2f953b,0x2aef7dad,0x5b6e2f84,
		        0x1521b628,0x29076170,0xecdd4775,0x619f1510,0x13cca830,0xeb61bd96,
		        0x0334fe1e,0xaa0363cf,0xb5735c90,0x4c70a239,0xd59e9e0b,0xcbaade14,
		        0xeecc86bc,0x60622ca7,0x9cab5cab,0xb2f3846e,0x648b1eaf,0x19bdf0ca,
		        0xa02369b9,0x655abb50,0x40685a32,0x3c2ab4b3,0x319ee9d5,0xc021b8f7,
		        0x9b540b19,0x875fa099,0x95f7997e,0x623d7da8,0xf837889a,0x97e32d77,
		        0x11ed935f,0x16681281,0x0e358829,0xc7e61fd6,0x96dedfa1,0x7858ba99,
		        0x57f584a5,0x1b227263,0x9b83c3ff,0x1ac24696,0xcdb30aeb,0x532e3054,
		        0x8fd948e4,0x6dbc3128,0x58ebf2ef,0x34c6ffea,0xfe28ed61,0xee7c3c73,
		        0x5d4a14d9,0xe864b7e3,0x42105d14,0x203e13e0,0x45eee2b6,0xa3aaabea,
		        0xdb6c4f15,0xfacb4fd0,0xc742f442,0xef6abbb5,0x654f3b1d,0x41cd2105,
		        0xd81e799e,0x86854dc7,0xe44b476a,0x3d816250,0xcf62a1f2,0x5b8d2646,
		        0xfc8883a0,0xc1c7b6a3,0x7f1524c3,0x69cb7492,0x47848a0b,0x5692b285,
		        0x095bbf00,0xad19489d,0x1462b174,0x23820e00,0x58428d2a,0x0c55f5ea,
		        0x1dadf43e,0x233f7061,0x3372f092,0x8d937e41,0xd65fecf1,0x6c223bdb,
		        0x7cde3759,0xcbee7460,0x4085f2a7,0xce77326e,0xa6078084,0x19f8509e,
		        0xe8efd855,0x61d99735,0xa969a7aa,0xc50c06c2,0x5a04abfc,0x800bcadc,
		        0x9e447a2e,0xc3453484,0xfdd56705,0x0e1e9ec9,0xdb73dbd3,0x105588cd,
		        0x675fda79,0xe3674340,0xc5c43465,0x713e38d8,0x3d28f89e,0xf16dff20,
		        0x153e21e7,0x8fb03d4a,0xe6e39f2b,0xdb83adf7
		        ];
	};
	_inst.Fbf_S2=function(){
		return [
		        0xe93d5a68,0x948140f7,0xf64c261c,0x94692934,0x411520f7,0x7602d4f7,
		        0xbcf46b2e,0xd4a20068,0xd4082471,0x3320f46a,0x43b7d4b7,0x500061af,
		        0x1e39f62e,0x97244546,0x14214f74,0xbf8b8840,0x4d95fc1d,0x96b591af,
		        0x70f4ddd3,0x66a02f45,0xbfbc09ec,0x03bd9785,0x7fac6dd0,0x31cb8504,
		        0x96eb27b3,0x55fd3941,0xda2547e6,0xabca0a9a,0x28507825,0x530429f4,
		        0x0a2c86da,0xe9b66dfb,0x68dc1462,0xd7486900,0x680ec0a4,0x27a18dee,
		        0x4f3ffea2,0xe887ad8c,0xb58ce006,0x7af4d6b6,0xaace1e7c,0xd3375fec,
		        0xce78a399,0x406b2a42,0x20fe9e35,0xd9f385b9,0xee39d7ab,0x3b124e8b,
		        0x1dc9faf7,0x4b6d1856,0x26a36631,0xeae397b2,0x3a6efa74,0xdd5b4332,
		        0x6841e7f7,0xca7820fb,0xfb0af54e,0xd8feb397,0x454056ac,0xba489527,
		        0x55533a3a,0x20838d87,0xfe6ba9b7,0xd096954b,0x55a867bc,0xa1159a58,
		        0xcca92963,0x99e1db33,0xa62a4a56,0x3f3125f9,0x5ef47e1c,0x9029317c,
		        0xfdf8e802,0x04272f70,0x80bb155c,0x05282ce3,0x95c11548,0xe4c66d22,
		        0x48c1133f,0xc70f86dc,0x07f9c9ee,0x41041f0f,0x404779a4,0x5d886e17,
		        0x325f51eb,0xd59bc0d1,0xf2bcc18f,0x41113564,0x257b7834,0x602a9c60,
		        0xdff8e8a3,0x1f636c1b,0x0e12b4c2,0x02e1329e,0xaf664fd1,0xcad18115,
		        0x6b2395e0,0x333e92e1,0x3b240b62,0xeebeb922,0x85b2a20e,0xe6ba0d99,
		        0xde720c8c,0x2da2f728,0xd0127845,0x95b794fd,0x647d0862,0xe7ccf5f0,
		        0x5449a36f,0x877d48fa,0xc39dfd27,0xf33e8d1e,0x0a476341,0x992eff74,
		        0x3a6f6eab,0xf4f8fd37,0xa812dc60,0xa1ebddf8,0x991be14c,0xdb6e6b0d,
		        0xc67b5510,0x6d672c37,0x2765d43b,0xdcd0e804,0xf1290dc7,0xcc00ffa3,
		        0xb5390f92,0x690fed0b,0x667b9ffb,0xcedb7d9c,0xa091cf0b,0xd9155ea3,
		        0xbb132f88,0x515bad24,0x7b9479bf,0x763bd6eb,0x37392eb3,0xcc115979,
		        0x8026e297,0xf42e312d,0x6842ada7,0xc66a2b3b,0x12754ccc,0x782ef11c,
		        0x6a124237,0xb79251e7,0x06a1bbe6,0x4bfb6350,0x1a6b1018,0x11caedfa,
		        0x3d25bdd8,0xe2e1c3c9,0x44421659,0x0a121386,0xd90cec6e,0xd5abea2a,
		        0x64af674e,0xda86a85f,0xbebfe988,0x64e4c3fe,0x9dbc8057,0xf0f7c086,
		        0x60787bf8,0x6003604d,0xd1fd8346,0xf6381fb0,0x7745ae04,0xd736fccc,
		        0x83426b33,0xf01eab71,0xb0804187,0x3c005e5f,0x77a057be,0xbde8ae24,
		        0x55464299,0xbf582e61,0x4e58f48f,0xf2ddfda2,0xf474ef38,0x8789bdc2,
		        0x5366f9c3,0xc8b38e74,0xb475f255,0x46fcd9b9,0x7aeb2661,0x8b1ddf84,
		        0x846a0e79,0x915f95e2,0x466e598e,0x20b45770,0x8cd55591,0xc902de4c,
		        0xb90bace1,0xbb8205d0,0x11a86248,0x7574a99e,0xb77f19b6,0xe0a9dc09,
		        0x662d09a1,0xc4324633,0xe85a1f02,0x09f0be8c,0x4a99a025,0x1d6efe10,
		        0x1ab93d1d,0x0ba5a4df,0xa186f20f,0x2868f169,0xdcb7da83,0x573906fe,
		        0xa1e2ce9b,0x4fcd7f52,0x50115e01,0xa70683fa,0xa002b5c4,0x0de6d027,
		        0x9af88c27,0x773f8641,0xc3604c06,0x61a806b5,0xf0177a28,0xc0f586e0,
		        0x006058aa,0x30dc7d62,0x11e69ed7,0x2338ea63,0x53c2dd94,0xc2c21634,
		        0xbbcbee56,0x90bcb6de,0xebfc7da1,0xce591d76,0x6f05e409,0x4b7c0188,
		        0x39720a3d,0x7c927c24,0x86e3725f,0x724d9db9,0x1ac15bb4,0xd39eb8fc,
		        0xed545578,0x08fca5b5,0xd83d7cd3,0x4dad0fc4,0x1e50ef5e,0xb161e6f8,
		        0xa28514d9,0x6c51133c,0x6fd5c7e7,0x56e14ec4,0x362abfce,0xddc6c837,
		        0xd79a3234,0x92638212,0x670efa8e,0x406000e0
		        ];
	};
	_inst.Fbf_S3=function(){
		return [
		        0x3a39ce37,0xd3faf5cf,0xabc27737,0x5ac52d1b,0x5cb0679e,0x4fa33742,
		        0xd3822740,0x99bc9bbe,0xd5118e9d,0xbf0f7315,0xd62d1c7e,0xc700c47b,
		        0xb78c1b6b,0x21a19045,0xb26eb1be,0x6a366eb4,0x5748ab2f,0xbc946e79,
		        0xc6a376d2,0x6549c2c8,0x530ff8ee,0x468dde7d,0xd5730a1d,0x4cd04dc6,
		        0x2939bbdb,0xa9ba4650,0xac9526e8,0xbe5ee304,0xa1fad5f0,0x6a2d519a,
		        0x63ef8ce2,0x9a86ee22,0xc089c2b8,0x43242ef6,0xa51e03aa,0x9cf2d0a4,
		        0x83c061ba,0x9be96a4d,0x8fe51550,0xba645bd6,0x2826a2f9,0xa73a3ae1,
		        0x4ba99586,0xef5562e9,0xc72fefd3,0xf752f7da,0x3f046f69,0x77fa0a59,
		        0x80e4a915,0x87b08601,0x9b09e6ad,0x3b3ee593,0xe990fd5a,0x9e34d797,
		        0x2cf0b7d9,0x022b8b51,0x96d5ac3a,0x017da67d,0xd1cf3ed6,0x7c7d2d28,
		        0x1f9f25cf,0xadf2b89b,0x5ad6b472,0x5a88f54c,0xe029ac71,0xe019a5e6,
		        0x47b0acfd,0xed93fa9b,0xe8d3c48d,0x283b57cc,0xf8d56629,0x79132e28,
		        0x785f0191,0xed756055,0xf7960e44,0xe3d35e8c,0x15056dd4,0x88f46dba,
		        0x03a16125,0x0564f0bd,0xc3eb9e15,0x3c9057a2,0x97271aec,0xa93a072a,
		        0x1b3f6d9b,0x1e6321f5,0xf59c66fb,0x26dcf319,0x7533d928,0xb155fdf5,
		        0x03563482,0x8aba3cbb,0x28517711,0xc20ad9f8,0xabcc5167,0xccad925f,
		        0x4de81751,0x3830dc8e,0x379d5862,0x9320f991,0xea7a90c2,0xfb3e7bce,
		        0x5121ce64,0x774fbe32,0xa8b6e37e,0xc3293d46,0x48de5369,0x6413e680,
		        0xa2ae0810,0xdd6db224,0x69852dfd,0x09072166,0xb39a460a,0x6445c0dd,
		        0x586cdecf,0x1c20c8ae,0x5bbef7dd,0x1b588d40,0xccd2017f,0x6bb4e3bb,
		        0xdda26a7e,0x3a59ff45,0x3e350a44,0xbcb4cdd5,0x72eacea8,0xfa6484bb,
		        0x8d6612ae,0xbf3c6f47,0xd29be463,0x542f5d9e,0xaec2771b,0xf64e6370,
		        0x740e0d8d,0xe75b1357,0xf8721671,0xaf537d5d,0x4040cb08,0x4eb4e2cc,
		        0x34d2466a,0x0115af84,0xe1b00428,0x95983a1d,0x06b89fb4,0xce6ea048,
		        0x6f3f3b82,0x3520ab82,0x011a1d4b,0x277227f8,0x611560b1,0xe7933fdc,
		        0xbb3a792b,0x344525bd,0xa08839e1,0x51ce794b,0x2f32c9b7,0xa01fbac9,
		        0xe01cc87e,0xbcc7d1f6,0xcf0111c3,0xa1e8aac7,0x1a908749,0xd44fbd9a,
		        0xd0dadecb,0xd50ada38,0x0339c32a,0xc6913667,0x8df9317c,0xe0b12b4f,
		        0xf79e59b7,0x43f5bb3a,0xf2d519ff,0x27d9459c,0xbf97222c,0x15e6fc2a,
		        0x0f91fc71,0x9b941525,0xfae59361,0xceb69ceb,0xc2a86459,0x12baa8d1,
		        0xb6c1075e,0xe3056a0c,0x10d25065,0xcb03a442,0xe0ec6e0e,0x1698db3b,
		        0x4c98a0be,0x3278e964,0x9f1f9532,0xe0d392df,0xd3a0342b,0x8971f21e,
		        0x1b0a7441,0x4ba3348c,0xc5be7120,0xc37632d8,0xdf359f8d,0x9b992f2e,
		        0xe60b6f47,0x0fe3f11d,0xe54cda54,0x1edad891,0xce6279cf,0xcd3e7e6f,
		        0x1618b166,0xfd2c1d05,0x848fd2c5,0xf6fb2299,0xf523f357,0xa6327623,
		        0x93a83531,0x56cccd02,0xacf08162,0x5a75ebb5,0x6e163697,0x88d273cc,
		        0xde966292,0x81b949d0,0x4c50901b,0x71c65614,0xe6c6c7bd,0x327a140a,
		        0x45e1d006,0xc3f27b9a,0xc9aa53fd,0x62a80f00,0xbb25bfe2,0x35bdd2f6,
		        0x71126905,0xb2040222,0xb6cbcf7c,0xcd769c2b,0x53113ec0,0x1640e3d3,
		        0x38abbd60,0x2547adf0,0xba38209c,0xf746ce76,0x77afa1c5,0x20756060,
		        0x85cbfe4e,0x8ae88dd8,0x7aaaf9b0,0x4cf9aa7e,0x1948c25c,0x02fb8a8c,
		        0x01c36ae4,0xd6ebe1f9,0x90d4f869,0xa65cdea0,0x3f09252d,0xc208e69f,
		        0xb74e6132,0xce77e25b,0x578fdfe3,0x3ac372e6
		        ];
	};
	
	_inst.Fbf_P_ref = function(){
		return [
		        0x243F6A88, 0x85A308D3, 0x13198A2E, 0x03707344, 0xA4093822, 0x299F31D0,
		        0x082EFA98, 0xEC4E6C89, 0x452821E6, 0x38D01377, 0xBE5466CF, 0x34E90C6C, 0xC0AC29B7, 0xC97C50DD, 0x3F84D5B5,
		        0xB5470917, 0x9216D5D9, 0x8979FB1B
		        ];
	};
	
	_inst.Fbf_S0_ref = function(){
		return [
		        0xD1310BA6, 0x98DFB5AC, 0x2FFD72DB, 0xD01ADFB7, 0xB8E1AFED, 0x6A267E96, 0xBA7C9045, 0xF12C7F99, 0x24A19947,
         0xB3916CF7, 0x0801F2E2, 0x858EFC16, 0x636920D8, 0x71574E69, 0xA458FEA3, 0xF4933D7E, 0x0D95748F, 0x728EB658,
         0x718BCD58, 0x82154AEE, 0x7B54A41D, 0xC25A59B5, 0x9C30D539, 0x2AF26013, 0xC5D1B023, 0x286085F0, 0xCA417918,
         0xB8DB38EF, 0x8E79DCB0, 0x603A180E, 0x6C9E0E8B, 0xB01E8A3E, 0xD71577C1, 0xBD314B27, 0x78AF2FDA, 0x55605C60,
         0xE65525F3, 0xAA55AB94, 0x57489862, 0x63E81440, 0x55CA396A, 0x2AAB10B6, 0xB4CC5C34, 0x1141E8CE, 0xA15486AF,
         0x7C72E993, 0xB3EE1411, 0x636FBC2A, 0x2BA9C55D, 0x741831F6, 0xCE5C3E16, 0x9B87931E, 0xAFD6BA33, 0x6C24CF5C,
         0x7A325381, 0x28958677, 0x3B8F4898, 0x6B4BB9AF, 0xC4BFE81B, 0x66282193, 0x61D809CC, 0xFB21A991, 0x487CAC60,
         0x5DEC8032, 0xEF845D5D, 0xE98575B1, 0xDC262302, 0xEB651B88, 0x23893E81, 0xD396ACC5, 0x0F6D6FF3, 0x83F44239,
         0x2E0B4482, 0xA4842004, 0x69C8F04A, 0x9E1F9B5E, 0x21C66842, 0xF6E96C9A, 0x670C9C61, 0xABD388F0, 0x6A51A0D2,
         0xD8542F68, 0x960FA728, 0xAB5133A3, 0x6EEF0B6C, 0x137A3BE4, 0xBA3BF050, 0x7EFB2A98, 0xA1F1651D, 0x39AF0176,
         0x66CA593E, 0x82430E88, 0x8CEE8619, 0x456F9FB4, 0x7D84A5C3, 0x3B8B5EBE, 0xE06F75D8, 0x85C12073, 0x401A449F,
         0x56C16AA6, 0x4ED3AA62, 0x363F7706, 0x1BFEDF72, 0x429B023D, 0x37D0D724, 0xD00A1248, 0xDB0FEAD3, 0x49F1C09B,
         0x075372C9, 0x80991B7B, 0x25D479D8, 0xF6E8DEF7, 0xE3FE501A, 0xB6794C3B, 0x976CE0BD, 0x04C006BA, 0xC1A94FB6,
         0x409F60C4, 0x5E5C9EC2, 0x196A2463, 0x68FB6FAF, 0x3E6C53B5, 0x1339B2EB, 0x3B52EC6F, 0x6DFC511F, 0x9B30952C,
         0xCC814544, 0xAF5EBD09, 0xBEE3D004, 0xDE334AFD, 0x660F2807, 0x192E4BB3, 0xC0CBA857, 0x45C8740F, 0xD20B5F39,
         0xB9D3FBDB, 0x5579C0BD, 0x1A60320A, 0xD6A100C6, 0x402C7279, 0x679F25FE, 0xFB1FA3CC, 0x8EA5E9F8, 0xDB3222F8,
         0x3C7516DF, 0xFD616B15, 0x2F501EC8, 0xAD0552AB, 0x323DB5FA, 0xFD238760, 0x53317B48, 0x3E00DF82, 0x9E5C57BB,
         0xCA6F8CA0, 0x1A87562E, 0xDF1769DB, 0xD542A8F6, 0x287EFFC3, 0xAC6732C6, 0x8C4F5573, 0x695B27B0, 0xBBCA58C8,
         0xE1FFA35D, 0xB8F011A0, 0x10FA3D98, 0xFD2183B8, 0x4AFCB56C, 0x2DD1D35B, 0x9A53E479, 0xB6F84565, 0xD28E49BC,
         0x4BFB9790, 0xE1DDF2DA, 0xA4CB7E33, 0x62FB1341, 0xCEE4C6E8, 0xEF20CADA, 0x36774C01, 0xD07E9EFE, 0x2BF11FB4,
         0x95DBDA4D, 0xAE909198, 0xEAAD8E71, 0x6B93D5A0, 0xD08ED1D0, 0xAFC725E0, 0x8E3C5B2F, 0x8E7594B7, 0x8FF6E2FB,
         0xF2122B64, 0x8888B812, 0x900DF01C, 0x4FAD5EA0, 0x688FC31C, 0xD1CFF191, 0xB3A8C1AD, 0x2F2F2218, 0xBE0E1777,
         0xEA752DFE, 0x8B021FA1, 0xE5A0CC0F, 0xB56F74E8, 0x18ACF3D6, 0xCE89E299, 0xB4A84FE0, 0xFD13E0B7, 0x7CC43B81,
         0xD2ADA8D9, 0x165FA266, 0x80957705, 0x93CC7314, 0x211A1477, 0xE6AD2065, 0x77B5FA86, 0xC75442F5, 0xFB9D35CF,
         0xEBCDAF0C, 0x7B3E89A0, 0xD6411BD3, 0xAE1E7E49, 0x00250E2D, 0x2071B35E, 0x226800BB, 0x57B8E0AF, 0x2464369B,
         0xF009B91E, 0x5563911D, 0x59DFA6AA, 0x78C14389, 0xD95A537F, 0x207D5BA2, 0x02E5B9C5, 0x83260376, 0x6295CFA9,
         0x11C81968, 0x4E734A41, 0xB3472DCA, 0x7B14A94A, 0x1B510052, 0x9A532915, 0xD60F573F, 0xBC9BC6E4, 0x2B60A476,
         0x81E67400, 0x08BA6FB5, 0x571BE91F, 0xF296EC6B, 0x2A0DD915, 0xB6636521, 0xE7B9F9B6, 0xFF34052E, 0xC5855664,
         0x53B02D5D, 0xA99F8FA1, 0x08BA4799, 0x6E85076A
         ];
	};
	_inst.Fbf_S1_ref = function(){
		return [
	     0x4B7A70E9, 0xB5B32944, 0xDB75092E, 0xC4192623, 0xAD6EA6B0, 0x49A7DF7D, 0x9CEE60B8, 0x8FEDB266, 0xECAA8C71,
         0x699A17FF, 0x5664526C, 0xC2B19EE1, 0x193602A5, 0x75094C29, 0xA0591340, 0xE4183A3E, 0x3F54989A, 0x5B429D65,
         0x6B8FE4D6, 0x99F73FD6, 0xA1D29C07, 0xEFE830F5, 0x4D2D38E6, 0xF0255DC1, 0x4CDD2086, 0x8470EB26, 0x6382E9C6,
         0x021ECC5E, 0x09686B3F, 0x3EBAEFC9, 0x3C971814, 0x6B6A70A1, 0x687F3584, 0x52A0E286, 0xB79C5305, 0xAA500737,
         0x3E07841C, 0x7FDEAE5C, 0x8E7D44EC, 0x5716F2B8, 0xB03ADA37, 0xF0500C0D, 0xF01C1F04, 0x0200B3FF, 0xAE0CF51A,
         0x3CB574B2, 0x25837A58, 0xDC0921BD, 0xD19113F9, 0x7CA92FF6, 0x94324773, 0x22F54701, 0x3AE5E581, 0x37C2DADC,
         0xC8B57634, 0x9AF3DDA7, 0xA9446146, 0x0FD0030E, 0xECC8C73E, 0xA4751E41, 0xE238CD99, 0x3BEA0E2F, 0x3280BBA1,
         0x183EB331, 0x4E548B38, 0x4F6DB908, 0x6F420D03, 0xF60A04BF, 0x2CB81290, 0x24977C79, 0x5679B072, 0xBCAF89AF,
         0xDE9A771F, 0xD9930810, 0xB38BAE12, 0xDCCF3F2E, 0x5512721F, 0x2E6B7124, 0x501ADDE6, 0x9F84CD87, 0x7A584718,
         0x7408DA17, 0xBC9F9ABC, 0xE94B7D8C, 0xEC7AEC3A, 0xDB851DFA, 0x63094366, 0xC464C3D2, 0xEF1C1847, 0x3215D908,
         0xDD433B37, 0x24C2BA16, 0x12A14D43, 0x2A65C451, 0x50940002, 0x133AE4DD, 0x71DFF89E, 0x10314E55, 0x81AC77D6,
         0x5F11199B, 0x043556F1, 0xD7A3C76B, 0x3C11183B, 0x5924A509, 0xF28FE6ED, 0x97F1FBFA, 0x9EBABF2C, 0x1E153C6E,
         0x86E34570, 0xEAE96FB1, 0x860E5E0A, 0x5A3E2AB3, 0x771FE71C, 0x4E3D06FA, 0x2965DCB9, 0x99E71D0F, 0x803E89D6,
         0x5266C825, 0x2E4CC978, 0x9C10B36A, 0xC6150EBA, 0x94E2EA78, 0xA5FC3C53, 0x1E0A2DF4, 0xF2F74EA7, 0x361D2B3D,
         0x1939260F, 0x19C27960, 0x5223A708, 0xF71312B6, 0xEBADFE6E, 0xEAC31F66, 0xE3BC4595, 0xA67BC883, 0xB17F37D1,
         0x018CFF28, 0xC332DDEF, 0xBE6C5AA5, 0x65582185, 0x68AB9802, 0xEECEA50F, 0xDB2F953B, 0x2AEF7DAD, 0x5B6E2F84,
         0x1521B628, 0x29076170, 0xECDD4775, 0x619F1510, 0x13CCA830, 0xEB61BD96, 0x0334FE1E, 0xAA0363CF, 0xB5735C90,
         0x4C70A239, 0xD59E9E0B, 0xCBAADE14, 0xEECC86BC, 0x60622CA7, 0x9CAB5CAB, 0xB2F3846E, 0x648B1EAF, 0x19BDF0CA,
         0xA02369B9, 0x655ABB50, 0x40685A32, 0x3C2AB4B3, 0x319EE9D5, 0xC021B8F7, 0x9B540B19, 0x875FA099, 0x95F7997E,
         0x623D7DA8, 0xF837889A, 0x97E32D77, 0x11ED935F, 0x16681281, 0x0E358829, 0xC7E61FD6, 0x96DEDFA1, 0x7858BA99,
         0x57F584A5, 0x1B227263, 0x9B83C3FF, 0x1AC24696, 0xCDB30AEB, 0x532E3054, 0x8FD948E4, 0x6DBC3128, 0x58EBF2EF,
         0x34C6FFEA, 0xFE28ED61, 0xEE7C3C73, 0x5D4A14D9, 0xE864B7E3, 0x42105D14, 0x203E13E0, 0x45EEE2B6, 0xA3AAABEA,
         0xDB6C4F15, 0xFACB4FD0, 0xC742F442, 0xEF6ABBB5, 0x654F3B1D, 0x41CD2105, 0xD81E799E, 0x86854DC7, 0xE44B476A,
         0x3D816250, 0xCF62A1F2, 0x5B8D2646, 0xFC8883A0, 0xC1C7B6A3, 0x7F1524C3, 0x69CB7492, 0x47848A0B, 0x5692B285,
         0x095BBF00, 0xAD19489D, 0x1462B174, 0x23820E00, 0x58428D2A, 0x0C55F5EA, 0x1DADF43E, 0x233F7061, 0x3372F092,
         0x8D937E41, 0xD65FECF1, 0x6C223BDB, 0x7CDE3759, 0xCBEE7460, 0x4085F2A7, 0xCE77326E, 0xA6078084, 0x19F8509E,
         0xE8EFD855, 0x61D99735, 0xA969A7AA, 0xC50C06C2, 0x5A04ABFC, 0x800BCADC, 0x9E447A2E, 0xC3453484, 0xFDD56705,
         0x0E1E9EC9, 0xDB73DBD3, 0x105588CD, 0x675FDA79, 0xE3674340, 0xC5C43465, 0x713E38D8, 0x3D28F89E, 0xF16DFF20,
         0x153E21E7, 0x8FB03D4A, 0xE6E39F2B, 0xDB83ADF7];
	};
	_inst.Fbf_S2_ref = function(){
		return [
	     0xE93D5A68, 0x948140F7, 0xF64C261C, 0x94692934, 0x411520F7, 0x7602D4F7, 0xBCF46B2E, 0xD4A20068, 0xD4082471,
         0x3320F46A, 0x43B7D4B7, 0x500061AF, 0x1E39F62E, 0x97244546, 0x14214F74, 0xBF8B8840, 0x4D95FC1D, 0x96B591AF,
         0x70F4DDD3, 0x66A02F45, 0xBFBC09EC, 0x03BD9785, 0x7FAC6DD0, 0x31CB8504, 0x96EB27B3, 0x55FD3941, 0xDA2547E6,
         0xABCA0A9A, 0x28507825, 0x530429F4, 0x0A2C86DA, 0xE9B66DFB, 0x68DC1462, 0xD7486900, 0x680EC0A4, 0x27A18DEE,
         0x4F3FFEA2, 0xE887AD8C, 0xB58CE006, 0x7AF4D6B6, 0xAACE1E7C, 0xD3375FEC, 0xCE78A399, 0x406B2A42, 0x20FE9E35,
         0xD9F385B9, 0xEE39D7AB, 0x3B124E8B, 0x1DC9FAF7, 0x4B6D1856, 0x26A36631, 0xEAE397B2, 0x3A6EFA74, 0xDD5B4332,
         0x6841E7F7, 0xCA7820FB, 0xFB0AF54E, 0xD8FEB397, 0x454056AC, 0xBA489527, 0x55533A3A, 0x20838D87, 0xFE6BA9B7,
         0xD096954B, 0x55A867BC, 0xA1159A58, 0xCCA92963, 0x99E1DB33, 0xA62A4A56, 0x3F3125F9, 0x5EF47E1C, 0x9029317C,
         0xFDF8E802, 0x04272F70, 0x80BB155C, 0x05282CE3, 0x95C11548, 0xE4C66D22, 0x48C1133F, 0xC70F86DC, 0x07F9C9EE,
         0x41041F0F, 0x404779A4, 0x5D886E17, 0x325F51EB, 0xD59BC0D1, 0xF2BCC18F, 0x41113564, 0x257B7834, 0x602A9C60,
         0xDFF8E8A3, 0x1F636C1B, 0x0E12B4C2, 0x02E1329E, 0xAF664FD1, 0xCAD18115, 0x6B2395E0, 0x333E92E1, 0x3B240B62,
         0xEEBEB922, 0x85B2A20E, 0xE6BA0D99, 0xDE720C8C, 0x2DA2F728, 0xD0127845, 0x95B794FD, 0x647D0862, 0xE7CCF5F0,
         0x5449A36F, 0x877D48FA, 0xC39DFD27, 0xF33E8D1E, 0x0A476341, 0x992EFF74, 0x3A6F6EAB, 0xF4F8FD37, 0xA812DC60,
         0xA1EBDDF8, 0x991BE14C, 0xDB6E6B0D, 0xC67B5510, 0x6D672C37, 0x2765D43B, 0xDCD0E804, 0xF1290DC7, 0xCC00FFA3,
         0xB5390F92, 0x690FED0B, 0x667B9FFB, 0xCEDB7D9C, 0xA091CF0B, 0xD9155EA3, 0xBB132F88, 0x515BAD24, 0x7B9479BF,
         0x763BD6EB, 0x37392EB3, 0xCC115979, 0x8026E297, 0xF42E312D, 0x6842ADA7, 0xC66A2B3B, 0x12754CCC, 0x782EF11C,
         0x6A124237, 0xB79251E7, 0x06A1BBE6, 0x4BFB6350, 0x1A6B1018, 0x11CAEDFA, 0x3D25BDD8, 0xE2E1C3C9, 0x44421659,
         0x0A121386, 0xD90CEC6E, 0xD5ABEA2A, 0x64AF674E, 0xDA86A85F, 0xBEBFE988, 0x64E4C3FE, 0x9DBC8057, 0xF0F7C086,
         0x60787BF8, 0x6003604D, 0xD1FD8346, 0xF6381FB0, 0x7745AE04, 0xD736FCCC, 0x83426B33, 0xF01EAB71, 0xB0804187,
         0x3C005E5F, 0x77A057BE, 0xBDE8AE24, 0x55464299, 0xBF582E61, 0x4E58F48F, 0xF2DDFDA2, 0xF474EF38, 0x8789BDC2,
         0x5366F9C3, 0xC8B38E74, 0xB475F255, 0x46FCD9B9, 0x7AEB2661, 0x8B1DDF84, 0x846A0E79, 0x915F95E2, 0x466E598E,
         0x20B45770, 0x8CD55591, 0xC902DE4C, 0xB90BACE1, 0xBB8205D0, 0x11A86248, 0x7574A99E, 0xB77F19B6, 0xE0A9DC09,
         0x662D09A1, 0xC4324633, 0xE85A1F02, 0x09F0BE8C, 0x4A99A025, 0x1D6EFE10, 0x1AB93D1D, 0x0BA5A4DF, 0xA186F20F,
         0x2868F169, 0xDCB7DA83, 0x573906FE, 0xA1E2CE9B, 0x4FCD7F52, 0x50115E01, 0xA70683FA, 0xA002B5C4, 0x0DE6D027,
         0x9AF88C27, 0x773F8641, 0xC3604C06, 0x61A806B5, 0xF0177A28, 0xC0F586E0, 0x006058AA, 0x30DC7D62, 0x11E69ED7,
         0x2338EA63, 0x53C2DD94, 0xC2C21634, 0xBBCBEE56, 0x90BCB6DE, 0xEBFC7DA1, 0xCE591D76, 0x6F05E409, 0x4B7C0188,
         0x39720A3D, 0x7C927C24, 0x86E3725F, 0x724D9DB9, 0x1AC15BB4, 0xD39EB8FC, 0xED545578, 0x08FCA5B5, 0xD83D7CD3,
         0x4DAD0FC4, 0x1E50EF5E, 0xB161E6F8, 0xA28514D9, 0x6C51133C, 0x6FD5C7E7, 0x56E14EC4, 0x362ABFCE, 0xDDC6C837,
         0xD79A3234, 0x92638212, 0x670EFA8E, 0x406000E0];
	};
	_inst.Fbf_S3_ref = function(){
		return [
		        0x3A39CE37, 0xD3FAF5CF, 0xABC27737, 0x5AC52D1B, 0x5CB0679E, 0x4FA33742, 0xD3822740, 0x99BC9BBE, 0xD5118E9D,
         0xBF0F7315, 0xD62D1C7E, 0xC700C47B, 0xB78C1B6B, 0x21A19045, 0xB26EB1BE, 0x6A366EB4, 0x5748AB2F, 0xBC946E79,
         0xC6A376D2, 0x6549C2C8, 0x530FF8EE, 0x468DDE7D, 0xD5730A1D, 0x4CD04DC6, 0x2939BBDB, 0xA9BA4650, 0xAC9526E8,
         0xBE5EE304, 0xA1FAD5F0, 0x6A2D519A, 0x63EF8CE2, 0x9A86EE22, 0xC089C2B8, 0x43242EF6, 0xA51E03AA, 0x9CF2D0A4,
         0x83C061BA, 0x9BE96A4D, 0x8FE51550, 0xBA645BD6, 0x2826A2F9, 0xA73A3AE1, 0x4BA99586, 0xEF5562E9, 0xC72FEFD3,
         0xF752F7DA, 0x3F046F69, 0x77FA0A59, 0x80E4A915, 0x87B08601, 0x9B09E6AD, 0x3B3EE593, 0xE990FD5A, 0x9E34D797,
         0x2CF0B7D9, 0x022B8B51, 0x96D5AC3A, 0x017DA67D, 0xD1CF3ED6, 0x7C7D2D28, 0x1F9F25CF, 0xADF2B89B, 0x5AD6B472,
         0x5A88F54C, 0xE029AC71, 0xE019A5E6, 0x47B0ACFD, 0xED93FA9B, 0xE8D3C48D, 0x283B57CC, 0xF8D56629, 0x79132E28,
         0x785F0191, 0xED756055, 0xF7960E44, 0xE3D35E8C, 0x15056DD4, 0x88F46DBA, 0x03A16125, 0x0564F0BD, 0xC3EB9E15,
         0x3C9057A2, 0x97271AEC, 0xA93A072A, 0x1B3F6D9B, 0x1E6321F5, 0xF59C66FB, 0x26DCF319, 0x7533D928, 0xB155FDF5,
         0x03563482, 0x8ABA3CBB, 0x28517711, 0xC20AD9F8, 0xABCC5167, 0xCCAD925F, 0x4DE81751, 0x3830DC8E, 0x379D5862,
         0x9320F991, 0xEA7A90C2, 0xFB3E7BCE, 0x5121CE64, 0x774FBE32, 0xA8B6E37E, 0xC3293D46, 0x48DE5369, 0x6413E680,
         0xA2AE0810, 0xDD6DB224, 0x69852DFD, 0x09072166, 0xB39A460A, 0x6445C0DD, 0x586CDECF, 0x1C20C8AE, 0x5BBEF7DD,
         0x1B588D40, 0xCCD2017F, 0x6BB4E3BB, 0xDDA26A7E, 0x3A59FF45, 0x3E350A44, 0xBCB4CDD5, 0x72EACEA8, 0xFA6484BB,
         0x8D6612AE, 0xBF3C6F47, 0xD29BE463, 0x542F5D9E, 0xAEC2771B, 0xF64E6370, 0x740E0D8D, 0xE75B1357, 0xF8721671,
         0xAF537D5D, 0x4040CB08, 0x4EB4E2CC, 0x34D2466A, 0x0115AF84, 0xE1B00428, 0x95983A1D, 0x06B89FB4, 0xCE6EA048,
         0x6F3F3B82, 0x3520AB82, 0x011A1D4B, 0x277227F8, 0x611560B1, 0xE7933FDC, 0xBB3A792B, 0x344525BD, 0xA08839E1,
         0x51CE794B, 0x2F32C9B7, 0xA01FBAC9, 0xE01CC87E, 0xBCC7D1F6, 0xCF0111C3, 0xA1E8AAC7, 0x1A908749, 0xD44FBD9A,
         0xD0DADECB, 0xD50ADA38, 0x0339C32A, 0xC6913667, 0x8DF9317C, 0xE0B12B4F, 0xF79E59B7, 0x43F5BB3A, 0xF2D519FF,
         0x27D9459C, 0xBF97222C, 0x15E6FC2A, 0x0F91FC71, 0x9B941525, 0xFAE59361, 0xCEB69CEB, 0xC2A86459, 0x12BAA8D1,
         0xB6C1075E, 0xE3056A0C, 0x10D25065, 0xCB03A442, 0xE0EC6E0E, 0x1698DB3B, 0x4C98A0BE, 0x3278E964, 0x9F1F9532,
         0xE0D392DF, 0xD3A0342B, 0x8971F21E, 0x1B0A7441, 0x4BA3348C, 0xC5BE7120, 0xC37632D8, 0xDF359F8D, 0x9B992F2E,
         0xE60B6F47, 0x0FE3F11D, 0xE54CDA54, 0x1EDAD891, 0xCE6279CF, 0xCD3E7E6F, 0x1618B166, 0xFD2C1D05, 0x848FD2C5,
         0xF6FB2299, 0xF523F357, 0xA6327623, 0x93A83531, 0x56CCCD02, 0xACF08162, 0x5A75EBB5, 0x6E163697, 0x88D273CC,
         0xDE966292, 0x81B949D0, 0x4C50901B, 0x71C65614, 0xE6C6C7BD, 0x327A140A, 0x45E1D006, 0xC3F27B9A, 0xC9AA53FD,
         0x62A80F00, 0xBB25BFE2, 0x35BDD2F6, 0x71126905, 0xB2040222, 0xB6CBCF7C, 0xCD769C2B, 0x53113EC0, 0x1640E3D3,
         0x38ABBD60, 0x2547ADF0, 0xBA38209C, 0xF746CE76, 0x77AFA1C5, 0x20756060, 0x85CBFE4E, 0x8AE88DD8, 0x7AAAF9B0,
         0x4CF9AA7E, 0x1948C25C, 0x02FB8A8C, 0x01C36AE4, 0xD6EBE1F9, 0x90D4F869, 0xA65CDEA0, 0x3F09252D, 0xC208E69F,
         0xB74E6132, 0xCE77E25B, 0x578FDFE3, 0x3AC372E6];
	};
	
	_inst.encrypt=function(dst, t){
		_inst.encCount++;
		var extra = 8 - (t.length % 8);
		if(extra == 8){
			extra = 0;
		}
		var t = _inst.escape(t);
		for(var i = 0;i < (t.length % 16); i++){
			t += '0';
		}
		// console.log("Escaped: '" + t + "'");
		var r= '' + extra;
		for(var i = 0; i < t.length; i += 16){
			_inst.xl_par = _inst.wordunescape(t.substr(i,8));
			_inst.xr_par = _inst.wordunescape(t.substr(i+8,8));
			// console.log("" +  _inst.xl_par.toString(16) + " : " + _inst.xr_par.toString(16));
			_inst.encipher();
			r += _inst.wordescape(_inst.xr_par) + _inst.wordescape(_inst.xl_par);
		}
		// console.log("CYPHERTEXT: " +  r);
		return r;
	};
	_inst.decrypt=function(src, t){
		_inst.decCount++;
		t = t.toUpperCase();
		var extra = t.charCodeAt(0) - 48;		
		t = t.substr(1);
		for(var i = 0; i < (t.length % 16); i++){
			t+='0';
		}
		var r = '';
		for (var i = 0;i < t.length; i += 16){
			_inst.xl_par = _inst.wordunescape(t.substr(i,8));
			_inst.xr_par = _inst.wordunescape(t.substr(i+8,8));
			_inst.decipher();
			r += _inst.wordescape(_inst.xr_par) + _inst.wordescape(_inst.xl_par);
		}
		t = _inst.unescape(r);
		
		if(extra != 0){
			t = t.substr(0, t.length - extra);
		}
		
		return t;
	};

	_inst.wordescape=function(w){
		var r = '';
		// reverse byteorder for intel systems
		var m = new Array (_inst.wordbyte0(w), _inst.wordbyte1(w), _inst.wordbyte2(w), _inst.wordbyte3(w));
		for(var i = 0;i < 4; i++){
			var t1 = Math.floor(m[i]/16);
			var t2 = m[i]%16;
			if (t1 < 10){
				t1 += 48;
			}
			else{
				t1 += 55;
			}
			if (t2 < 10){
				t2 += 48;
			}
			else{
				t2 += 55;
			}
			r += String.fromCharCode(t1) + String.fromCharCode(t2);
		}
		return r;
	};
	_inst.wordunescape=function(t){
		var r=0;
		for(var i=0; i < 8; i += 2){
			var t1 = t.charCodeAt(i);
			var t2 = t.charCodeAt(i+1);
			if (t1 < 58){
				t1 -= 48;
			}
			else{
				t1 -= 55;
			}
			if (t2 < 58){
				t2 -= 48;
			}
			else{
				t2 -= 55;
			}
			r = r*256 + (t1*16+ t2);
		}
		// console.log("T: '" + t + "' becomes: " + r.toString(16));
		return r;
	};

	_inst.encipher=function(){
		var t = _inst;
		var Xl=t.xl_par;
		var Xr=t.xr_par;
		
		Xl=t.xor(Xl,t.bf_P[0]);
		
		for(var i = 1; i < 16; i+= 2){
			// Xr = t.round(Xr,Xl,i);
			// Xl = t.round(Xl,Xr,i+1);
			Xr = t.xor(Xr, t.xor(t.F(Xl), t.bf_P[i]));
			Xl = t.xor(Xl, t.xor(t.F(Xr), t.bf_P[i+1]));
		}
		Xr=t.xor(Xr,t.bf_P[17]);
		
		t.xr_par = Xr;
		t.xl_par = Xl;
	};

	
	_inst.decipher=function(){
		var t = _inst;
		
		var Xl=t.xl_par;
		var Xr=t.xr_par;
		
		Xl=t.xor(Xl,t.bf_P[17]);
		
		for(var i = 16; i > 0; i -= 2){
			// Xr = t.round(Xr,Xl,i);
			// Xl = t.round(Xl,Xr,i-1);
			Xr = t.xor(Xr, t.xor(t.F(Xl), t.bf_P[i]));
			Xl = t.xor(Xl, t.xor(t.F(Xr), t.bf_P[i-1]));

		}
		Xr=t.xor(Xr,t.bf_P[0]);

		t.xl_par=Xl;
		t.xr_par=Xr;
	};
	
	_inst.escape = function(t){
		var r = '';
		for(var i = 0; i < t.length; i++){
			var c = t.charCodeAt(i);
			var t1 = Math.floor(c/16);
			var t2 = c%16;
			if (t1 < 10){
				t1 += 48;
			}
			else{
				t1 += 55;
			}
			if (t2 < 10){
				t2 += 48;
			}
			else{
				t2 += 55;
			}
			r += String.fromCharCode(t1) + String.fromCharCode(t2);
		}
		return r;
	};
	
	_inst.wordbyte0 = function(w){return Math.floor(Math.floor(Math.floor(w/256)/256)/256)%256};
	_inst.wordbyte1 = function(w){return Math.floor(Math.floor(w/256)/256)%256};
	_inst.wordbyte2 = function(w){return Math.floor(w/256)%256};
	_inst.wordbyte3 = function(w){return w%256};
	_inst.xor = function(w1,w2){
		var r=w1^w2;
		if (r<0){
			// console.log("Intervene: " + w1.toString(16) + " ^ " + w2.toString(16) + " == " + r.toString(16));
			r=0xffffffff+1+r;
			// console.log("Now: " + r.toString(16));
		}
		return r;
	};
	
	_inst.unescape = function(t){
		var r='';
		for(i = 0; i < t.length; i++){
			var t1 = t.charCodeAt(i++);
			var t2 = t.charCodeAt(i);
			if (t1 < 58){
				t1 -= 48;
			}
			else if (t1 > 96){
				t1 -= 87;
			}
			else{
				t1 -= 55;
			}
		
			if (t2 < 58){
				t2 -= 48;
			}
			else if (t2 > 96){
				t2 -= 87;
			}
			else{
				t2 -= 55;
			}
			var ch = t1*16 + t2;
			if(ch == 0){
				ch = 32;
			}
		
			r += String.fromCharCode(ch);
		}
		return r;
	};
	
	_inst.F=function(a){
		var t=_inst;
		var w0 = t.bf_S0[t.wordbyte0(a)] + t.bf_S1[t.wordbyte1(a)];
		var w1 = t.xor(w0, t.bf_S2[t.wordbyte2(a)]);
		w1 += t.bf_S3[t.wordbyte3(a)];
		return w1;
	};

	_inst.round=function(a,b,n){
		var t=_inst;
		var w0 = t.bf_S0[t.wordbyte0(b)] + t.bf_S1[t.wordbyte1(b)];
		var w1 = t.xor(w0, t.bf_S2[t.wordbyte2(b)]);
		w1 += t.bf_S3[t.wordbyte3(b)];
		
		return (t.xor(a,w1));
	};

	
	_inst.processTable = function(xl, xr, table){
		var t = _inst;
		
		for(var s = 0; s < table.length; s += 2){
            xl = t.xor(xl, t.bf_P[0]);
            for(var i = 1; i < 16; i+= 2){
            	xr = t.xor(xr, t.xor(t.F(xl), t.bf_P[i]));
            	xl = t.xor(xl, t.xor(t.F(xr), t.bf_P[i+1]));
            }
            xr = t.xor(xr,t.bf_P[17]);
            
            table[s] = xr;
            table[s+1] = xl;
            
            xr = xl;
            xl = table[s];
		}
    }	

	_inst.initWithKey = function(kStr){
		if (kStr.length==0){
			return "Empty Key";
		}
	
		_inst.bf_P = _inst.Fbf_P();
		_inst.bf_S0 = _inst.Fbf_S0();
		_inst.bf_S1 = _inst.Fbf_S1();
		_inst.bf_S2 = _inst.Fbf_S2();
		_inst.bf_S3 = _inst.Fbf_S3();
		
		var pooky = function(name, a, b){
			if(a.length != b.length){
				console.log(name + " differs in length");
				process.exit(-1);
			}
			for(var i = 0; i < a.length; i++){
				if(a[i] != b[i]){
					console.log(name + " differs at " + i + " " + a[i] + " != " + b[i]);
					process.exit(-1);
				}
			}
				
		}
		
		
		pooky("P", _inst.bf_P, _inst.Fbf_P_ref());
		pooky("S0", _inst.bf_S0, _inst.Fbf_S0_ref());
		pooky("S1", _inst.bf_S1, _inst.Fbf_S1_ref());
		pooky("S2", _inst.bf_S2, _inst.Fbf_S2_ref());
		pooky("S3", _inst.bf_S3, _inst.Fbf_S3_ref());
		
	
	
		_inst.key = (kStr.length>56)?kStr.substr(0,56):kStr;
	
		// console.log("Key: '" + _inst.key + "'");
		var k = 0;
		for(var i = 0; i < 18; i++){
			var d = 0;
			for(var j = 0; j < 4; j++){
				d = d * 256;
				d += _inst.key.charCodeAt(k % (_inst.key.length));
				k++;
				if(k == _inst.key.length){
					k = 0;
				}
			}
			
			// console.log("[" + i + "]: " + d.toString(16));
			// console.log("00000000: " + (_inst.xor(0,d)).toString(16));
			// console.log("FFFFFFFF: " + (_inst.xor(0xffffffff,d)).toString(16));
			// console.log("        : " + (_inst.xor(d,d)).toString(16));
			
			_inst.bf_P[i] = _inst.xor(_inst.bf_P[i],d);
		}
		
		_inst.key = _inst.escape(_inst.key);
		
		
		
		_inst.processTable(0, 0, _inst.bf_P);
        _inst.processTable(_inst.bf_P[16], _inst.bf_P[17], _inst.bf_S0);
        _inst.processTable(_inst.bf_S0[254], _inst.bf_S0[255], _inst.bf_S1);
        _inst.processTable(_inst.bf_S1[254], _inst.bf_S1[255], _inst.bf_S2);
        _inst.processTable(_inst.bf_S2[254], _inst.bf_S2[255], _inst.bf_S3);

		pooky("P", _inst.Fbf_P(), _inst.Fbf_P_ref());
		pooky("S0", _inst.Fbf_S0(), _inst.Fbf_S0_ref());
		pooky("S1", _inst.Fbf_S1(), _inst.Fbf_S1_ref());
		pooky("S2", _inst.Fbf_S2(), _inst.Fbf_S2_ref());
		pooky("S3", _inst.Fbf_S3(), _inst.Fbf_S3_ref());
		
	};
	
	return _inst;

	
};var GolgiNet = {
	init : function(){
		var _inst = {};
		var obgHash = {}, // A hash of callbacks keyed on message-ids to be matched to incoming RES/ERR messages
			ibgHash = {}, // A hash of callbacks keyed on methid to be matched to incoming REQs
			ibgHash = {},
			devKey = undefined,
			appKey = undefined,
			instId = undefined,
			oneTimeRegToken = undefined;
			ntlConn = undefined,
			golgiOptions = {};
		
		_inst.setOption = function(key, value){
			golgiOptions[key] = value;
		}

		_inst.setCredentials = function(_devKey, _appKey, _instId){
			devKey = _devKey;
			appKey = _appKey;
			instId = _instId;
		};
		
		_inst.setOneTimeRegToken = function(_token){
		    devKey = "";
		    appKey = "";
		    instId = "";
		    oneTimeRegToken = _token;
		};
		
		var reconnect = function(host){
		    
		};
		
		var NTLConn = function(){
			var _inst = {}
			var host;
			var port;
			var bannerSeen = false;
			var bannerCode = 0;
			var bannerStr = "";
			var bannerCb;
			var closedCb;
			var closed = false;

			var gathering = false;
			var linesSoFar = "";
			var partialLast = false;
			var preAdd = "";
			var nextTid = 1;
			var obHash = {};
			var ibHash = {};
			var connImpl = NTLConnImpl(_inst);

			var sendNop = function(){
				if(!closed){
					setTimeout(sendNop, 5000);
					if(bannerSeen){
						_inst.sendNtlReq(function(rc, rcStr, payload){
							// console.log("NOP: " + rc);
						}, "nop");
					}
				}
			}

			_inst.startNops = function(){
				sendNop();
			}

			_inst.registerCmd = function(cmd, cb){
				ibHash[cmd] = cb;
			}

			_inst.nextTid = function(){
				var str = nextTid.toString(16);
				nextTid++;
				str = "0x" + "00000000".substr(str.length) + str;
				return str;
			}


			_inst.sendNtlReq = function(cb, cmd, payload){
				var id = _inst.nextTid();
				obHash[id] = cb;
				sendNtlReqWkr(id, cmd, payload);
			}

			var sendNtlReqWkr = function(tid, cmd, payload){
				if(payload == undefined){
					connImpl.write(tid + " " + cmd + "\n");
				}
				else{
					connImpl.write(tid + " " + cmd + "\\\n");
					connImpl.write(payload);
					connImpl.write(".\n");
				}
			}

			var processLinesSoFar = function(){
				linesSoFar = linesSoFar.trim();
				var tid = "";
				var rc = -1;
				var rcStr = undefined;
				var cmd = undefined;
				var payload = undefined;
				var err = false;

				var idx = linesSoFar.indexOf("\n");
				var firstLine;

				if(idx >= 0){
					firstLine = linesSoFar.substr(0, idx);
				}
				else{
					firstLine = linesSoFar;
				}
				var tokens = firstLine.split(" ");
				var remToks = tokens.length;

				// console.log("First Line: '" + firstLine + "'");
				idx = 0;

				if(remToks >= 1){
					tokens[idx] = tokens[idx].toLowerCase();

					if(tokens[idx].charAt(0) == '0' && tokens[idx].charAt(1) == 'x' ){
						tid = tokens[idx++];
						remToks--;
					}
					if(remToks >= 1){
						var tmp = parseInt(tokens[idx]);
						// console.log("Parsing rc: " + tmp);
						if(isNaN(tmp)){
							//
							// Must be a command
							//
							cmd = tokens[idx].toLowerCase();
							// console.log("CMD: " + cmd);
							idx = linesSoFar.indexOf(tokens[idx]);
							payload = linesSoFar.substring(idx + cmd.length).trim();
						}
						else if(tmp > 0 && tmp < 999){
							if(!bannerSeen){
								bannerCode = tmp;
								idx = linesSoFar.indexOf(tokens[idx]);
								bannerStr = linesSoFar.substring(idx + tokens[idx].length).trim();
							}
							else{
								rc = tmp;
								idx++;
								remToks--;
								if(remToks >= 1){
									rcStr = tokens[idx];
									idx = linesSoFar.indexOf(tokens[idx]);
									payload = linesSoFar.substring(idx + rcStr.length).trim();
								}
								else{
									err = true;
								}
							}
						}
						else{
							err = true;
						}
					}
					else{
						err = true;
					}

					if(!err){
						if(!bannerSeen){
							if(bannerCode != 0){
								// console.log("Banner: " + bannerCode + " '" + bannerStr + "'");
								bannerSeen = true;
								bannerCb(bannerCode, bannerStr);
							}
						}
						else if(cmd != undefined){
							// console.log("Request Arrived: '" + tid + "' '" + cmd + "' '" + payload + "'");
							cmd = cmd.toLowerCase();
							var cb = ibHash[cmd];
							if(cb == undefined){
								console.log("Request Arrived: '" + cmd + "' with no handler");
								connImpl.write(tid + " 499 Unknown command\n");
							}
							else{
								cb(function(rc, rcStr, payload){
									// console.log("Responding to " + tid + " with " + rc + "/" + rcStr);
									if(payload == undefined){
										connImpl.write(tid + " " + rc + " " + rcStr + "\n");
									}
									else{
										connImpl.write(tid + " " + rc + " " + rcStr + "\\\n");
										connImpl.write(payload);
										connImpl.write(".\n");
									}
								}, payload);
							}
						}
						else if(rc > 0){
							// console.log("Response: '" + tid + "' '" + rc + "' '" + rcStr + "' '" + payload + "'");
							var cb = obHash[tid];
							if(cb != undefined){
								obHash[tid] = undefined;
								cb(rc, rcStr, payload);
							}
						}
						else{
							console.log("Huh, wasn't able to make head nor tails out of that");
						}
					}
				}
				linesSoFar = "";
			};

			_inst.dataCallback = function(data) {
				// console.log("DATA: " + data);
				if(data.length > 0){
					var dangling = "";

					if(data.charAt(data.length - 1) != '\n'){
						partialLast = true;
					}

					var lines = data.split("\n");

					if(partialLast){
						dangling = lines.pop();
					}

					for(var i = 0; i < lines.length; i++){
						var l = (preAdd + lines[i]).trim();
						preAdd = "";
						if(l.length > 0){
							if(gathering){
								if(l == "."){
									linesSoFar = linesSoFar + "\n";

									// console.log("Full entity gathered:");
									// console.log("****************************");
									// console.log(linesSoFar);
									// console.log("****************************");

									processLinesSoFar();
									gathering = false;
								}
								else{
									linesSoFar = linesSoFar + "\n" + l;
								}
							}
							else if(l.charAt(l.length-1) == '\\'){
								linesSoFar = l.substr(0, l.length-1);
								gathering = true;
							}
							else{
								// console.log("Line Received: " + l);
								linesSoFar = l + "\n";
								processLinesSoFar();
							}
						}
					}
					preAdd = preAdd + dangling;
				}
			}

			_inst.closeCallback = function(){
				// console.log("Closed");
				closedCb();
			}

			_inst.connect = function(_host, _port, _bannerCb, _closedCb){
				host = _host;
				port = _port;
				bannerCb = _bannerCb;
				closedCb = _closedCb;

				connImpl.connect(port, host);
				
			}

			return _inst;
		};

		var idBase = undefined,
		idNext = 1;

		_inst.genMsgId = function(){
			if(idBase == undefined){
				idBase = "." + (new Date()).getTime();
			}
			return "" + (idNext++) + idBase;
		};
		
		var regCb = undefined;
		var svrHost = undefined;
		
		_inst.bannerCb = function(rc, rcStr){
		    // console.log("Banner(1): " + rc + "'" + rcStr + "'");
		    if(rc >= 200 && rc <= 399){
			ntlConn.startNops();

			var payload = "";
			payload += "dev_key: \"" + GolgiLib.escapeString(devKey) + "\"\n";
			payload += "api_key: \"" + GolgiLib.escapeString(appKey) + "\"\n";
			payload += "app_user_id: \"" + GolgiLib.escapeString(instId) + "\"\n";
			payload += "push_id: \"\"\n";
			payload += "device_type: 0\n";
			
			if(oneTimeRegToken != undefined){
			    payload += "options.000.key: \"ONE_TIME_REG_TOKEN\"\n";
			    payload += "options.000.value: \"" + oneTimeRegToken + "\"\n";
			}
			
			ntlConn.sendNtlReq(function(rc, rcStr, payload){
			    if(rc >= 200 && rc <= 399){
				//
				// Successful register
				//	
				if(regCb != undefined){
				    regCb();
				    regCb = undefined;
				}
			    }
			    else{
				console.log("Register returned: " + rc + "/" + rcStr);
				if(regCb != undefined){
				    regCb("Failed: " + rc + "/" + rcStr);
				    regCb = undefined;
				}
			    }
			}, "golgi_register", payload);
		    }
		};
		
		_inst.closedCb = function(){
		    // Closed
		    console.log("***************************************");
		    console.log("***************************************");
		    console.log("Closed");
		    console.log("***************************************");
		    console.log("***************************************");
		    ntlConn.connect(svrHost, 443, _inst.bannerCb, _inst.closedCb);
		};
		
		_inst.preRegister = function(oboInstId, _preRegCb){
			var payload = "";
			payload += "dev_key: \"" + GolgiLib.escapeString(devKey) + "\"\n";
			payload += "api_key: \"" + GolgiLib.escapeString(appKey) + "\"\n";
			payload += "app_user_id: \"" + GolgiLib.escapeString(oboInstId) + "\"\n";
			payload += "push_id: \"\"\n";
			payload += "device_type: 0\n";
			payload += "options.000.key: \"PREREG\"\n";
			payload += "options.000.value: \"1\"\n";
			ntlConn.sendNtlReq(function(rc, rcStr, p1){
			    if(rc < 300 || rc > 399){
				_preRegCb(rc);
			    }
			    else{
				var token = undefined;
				var wasKey = 0;
				var lines = p1.split("\n");
				for(var i = 0; i < lines.length; i++){
				    var l = lines[i];
				    var idx;
				    if(l.length > 9 && l.substr(0, 9) == "go_llist."){
					if((idx = l.indexOf(".key: \"")) > 0){
					    wasKey = 0;
					    l = l.substr(idx + 7);
					    // console.log("Work with '" + l + "'");
					    if((idx = l.indexOf('"')) > 0){
						l = l.substr(0, idx);
						// console.log("Key: '" + l + "'");
						if(l == 'ONE_TIME_REG_TOKEN'){
						    wasKey = 1;
						}
					    }
					}
					if((idx = l.indexOf(".value: \"")) > 0){
					    if(wasKey != 0){
						l = l.substr(idx + 9);
						// console.log("Work with '" + l + "'");
						if((idx = l.indexOf('"')) > 0){
						    l = l.substr(0, idx);
						    // console.log("value: '" + l + "'");
						    token = l;
						}
					    }
					    wasKey = 0;
					}
				    }
				}
				_preRegCb(rc, token);
			    }
			}, "golgi_register", payload);
		};

		_inst.register = function(_regCb){
		    	regCb = _regCb;
		    
		    	_inst.useLoopback = false;
		    	if(golgiOptions["LOOPBACK"] != undefined){
				if(golgiOptions["LOOPBACK"] == 1){
					_inst.useLoopback = true;
				}
			}
			
			if(_inst.useLoopback){
				regCb();
			}
			else{
				ntlConn = NTLConn();

				ntlConn.registerCmd("golgi_send_msg", _inst.inboundGolgiSendMsg);
			
				svrHost = "gp.o17g.com";
			
				if(golgiOptions["USE_TEST_SERVER"] != undefined){
					if(golgiOptions["USE_TEST_SERVER"] == 1){
						svrHost = "gt.o17g.com";
						// console.log("Connecting to the test server: " + host);
					}	
				}
			
				ntlConn.connect(svrHost, 443, _inst.bannerCb, _inst.closedCb);
			}
		};
		
		_inst.registerGolgiMessageHandler = function(key, cb){
			// console.log("Registering '" + key + "' in ibgHash");
			ibgHash[key] = cb;
		};
		
		
		_inst.inboundGolgiSendMsg = function(ntlCb, payload, gMsg){
			// console.log("Received 'golgi_send_msg': " + payload);
			var cryptoErrTxt = undefined;
			var cryptoErrMsg = undefined;
			var corrupt = false;
			
			if(gMsg == undefined){
				gMsg = GolgiLib.GolgiMessage();
				if(gMsg.deserialise(payload) != 0){
					corrupt = true;
				}
			}
			
			if(!corrupt){
			
				// console.log("Yayyy, decoded message");
				
				//
				// Check if the payload starts with "{E}", if
				// it does, then call the crypto implementation
				// (which had better be there) to decrypt
				// the payload
				//
				// console.log("Payload: " + gMsg.payload);
				if(gMsg.payload.indexOf("{E}") == 0){
					var cryptoImpl = GolgiLib.getCryptoImpl();
					if(cryptoImpl == undefined){
						//
						// An encrypted message has arrived, but we have no crypto implementation! 
						//
						
						cryptoErrTxt = "Receiver doesn't support encryption";
					}
					else{
						try{
							// console.log("************** DECRYPT *****************");
							// console.log("Payload: " + gMsg.payload);
							gMsg.payload = cryptoImpl.decrypt(gMsg.oa_app_user_id, gMsg.payload.substr(3));
 							// console.log("Payload: " + gMsg.payload);
						}
						catch(cryptoErr){
							//
							// At this point it doesn't matter what type of error this is (hard or soft)
							// we are stuffed and need to send back an exception
							//
							
							cryptoErrTxt = cryptoErr.errText;
						}
					}
				}
				
				if(cryptoErrTxt != undefined){

					cryptoErrMsg = GolgiLib.GolgiMessage();
					if(gMsg.msg_type == 0){ // REQ
						//
						// For a garbled REQ, we create a RES with an 
						// error and send it back to the originator
						// (reversed oa and da)
						//
						cryptoErrMsg.oa_app_user_id = gMsg.da_app_user_id;
						cryptoErrMsg.da_app_user_id = gMsg.oa_app_user_id;
					}
					else{
						//
						// For a garbled RES, we ACK the res and send an
						// error RES on to the local handler (same oa and da)
						cryptoErrMsg.oa_app_user_id = gMsg.oa_app_user_id;
						cryptoErrMsg.da_app_user_id = gMsg.da_app_user_id;
					}
					cryptoErrMsg.message_id = gMsg.message_id;
					cryptoErrMsg.msg_type = 2; // ERR
					cryptoErrMsg.method = gMsg.method;
					cryptoErrMsg.err_type = -1;
					cryptoErrMsg.err_txt = cryptoErrTxt;
					
				}
				
				if(gMsg.msg_type == 0){ // A Req
					// console.log("It's a REQ");
					
					if(cryptoErrMsg != undefined){
						if(_inst.useLoopback){
							_inst.inboundGolgiSendMsg(undefined, undefined, cryptoErrMsg);
							if(ntlCb != undefined){
								ntlCb.success(200, "Yumm");
							}
						}
						else{
							ntlConn.sendNtlReq(function(rc, rcStr, payload){
								if(rc >= 200 && rc <= 399){
									//
									// Successfully sent the ERR res,
									// eat the REQ
									//	
									ntlCb.success(200, "Yumm");
								}
								else{
									//
									// Failed to send the ERR res,
									// fail the REQ
									//
									console.log("Sending error message: " + rc + "/" + rcStr);
									ntlCb.fail(rc, rcStr);
								}
							}, "golgi_send_msg", errMsg.serialise());
						}
						return;
					}
					else{
						gcb = ibgHash[gMsg.method];
						if(gcb != undefined){
							// console.log("We have a handler for '" + gMsg.method + "'");
							gcb(ntlCb, gMsg);
						}
						else{
							console.log("No handler for '" + gMsg.method + "'");
							ntlCb(498, "NoHandler");
						}
					}
				}
				else if(gMsg.msg_type == 1 || gMsg.msg_type == 2){ // A RES or an ERR
					// console.log("It's a RES/ERR: " + gMag.msg_type);
					var golgiCb = obgHash[gMsg.message_id];
					if(golgiCb != undefined){
						obgHash[gMsg.message_id] = undefined;
						if(cryptoErrMsg != undefined){
							golgiCb.errArrived(cryptoErrMsg.err_type, cryptoErrMsg.err_txt);
						}
						else if(gMsg.msg_type == 1){
							golgiCb.resArrived(gMsg);
						}
						else{
							golgiCb.errArrived(gMsg.err_type, gMsg.err_txt);
						}
					}
					else{
						console.log("Eating RES/ERR for '" + gMsg.message_id + "' for command: " + gMsg.method);
					}
					ntlCb(300, "Yum");
				}
				else{
					console.log("Zoikes I don't know how to handle Golgi Message Type: " + gMsg.msg_type);
					ntlCb(498, "CannotProcessType");
				}
			}
			else{
				console.log("Boooo, didn't decode message");
				ntlCb(498, "FailedToDecode");
			}
			
		};

		

		_inst.sendReq = function(golgiCb, ntlCb, cmd, dst, options, arg){
			var msgId = _inst.genMsgId();


			var gMsg = GolgiLib.GolgiMessage();

			gMsg.dev_key = devKey;
			gMsg.api_key = appKey;
			gMsg.oa_app_user_id = instId;
			gMsg.da_app_user_id = dst;
			gMsg.message_id = msgId;
			gMsg.msg_type = 0;
			gMsg.method = cmd;
			gMsg.err_type = 0;
			gMsg.err_txt = "";
			gMsg.payload = arg.serialise();
			gMsg.options = options;
			
			//
			// Insert crypto here to encrypt the payload
			//
			var cryptoImpl = GolgiLib.getCryptoImpl();
			var cryptoErrMsg = undefined;
			if(cryptoImpl != undefined){
 				try{
					// console.log("************** ENCRYPT *****************");
					gMsg.payload = "{E}" + cryptoImpl.encrypt(gMsg.da_app_user_id, gMsg.payload);
				}
				catch(cryptoErr){
					if(cryptoErr.isHardError){
						// console.log("Hard Error: " + cryptoErr);
						cryptoErrMsg = GolgiLib.GolgiMessage();
						cryptoErrMsg.oa_app_user_id = gMsg.da_app_user_id;
						cryptoErrMsg.da_app_user_id = gMsg.oa_app_user_id;

						cryptoErrMsg.message_id = gMsg.message_id;
						cryptoErrMsg.msg_type = 2; // ERR
						cryptoErrMsg.method = gMsg.method;
						cryptoErrMsg.err_type = -1;
						cryptoErrMsg.err_txt = cryptoErr.errText;
					}
					else{
						//
						// Soft error, let it go
						//
						console.log("Soft Error: " + cryptoErr);
					}
				}
			}
			
			// console.log("Payload(2): " + gMsg.payload);
			
			if(cryptoErrMsg){
				golgiCb.errArrived(cryptoErrMsg.err_type, cryptoErrMsg.err_txt);
			}
			else{
				obgHash[msgId] = golgiCb;
				if(_inst.useLoopback){
					_inst.inboundGolgiSendMsg(undefined, undefined, gMsg);
					if(ntlCb != undefined){
						ntlCb.success(200, "Yumm");
					}
				}
				else{
					ntlConn.sendNtlReq(function(rc, rcStr, payload){
						if(rc >= 400){
							console.log("Sending message: " + rc + "/" + rcStr);
							obgHash[msgId] = undefined;
							ntlCb.fail(rc, rcStr);
						}
						else{
							ntlCb.success(rc, rcStr);
						}
					}, "golgi_send_msg", gMsg.serialise());
				}
			}
		};
		
		_inst.sendRes = function(ntlCb, msgId, cmd, dst, options, arg){
			
			// console.log("Sending a res");

			var gMsg = GolgiLib.GolgiMessage();

			gMsg.dev_key = devKey;
			gMsg.api_key = appKey;
			gMsg.oa_app_user_id = instId;
			gMsg.da_app_user_id = dst;
			gMsg.message_id = msgId;
			gMsg.msg_type = 1;
			gMsg.method = cmd;
			gMsg.err_type = 0;
			gMsg.err_txt = "";
			gMsg.payload = arg.serialise();
			gMsg.options = options;
			
			// console.log("Gonna send: " + gMsg.serialise());

			if(_inst.useLoopback){
				_inst.inboundGolgiSendMsg(undefined, undefined, gMsg);
				if(ntlCb != undefined){
					ntlCb.success(200, "Yumm");
				}
			}
			else{
				ntlConn.sendNtlReq(function(rc, rcStr, payload){
					if(rc >= 200 && rc <= 399){
						ntlCb.success(rc, rcStr);
					}
					else{
						console.log("Sending message: " + rc + "/" + rcStr);
						ntlCb.fail(rc, rcStr);
					}
				}, "golgi_send_msg", gMsg.serialise());
			}
		};
		

		_inst.regAlwaysOn_send = function(cb, dst, options){
			var payload = "";
			var gMsg = GolgiLib.GolgiMessage();
			gMsg.dev_key = devKey;
			gMsg.api_key = appKey;
			gMsg.oa_app_user_id = instId;
			gMsg.da_app_user_id = dst;
			gMsg.message_id = _inst.genMsgId();
			gMsg.msg_type = 0;
			gMsg.method = "regAlwaysOn.Whozin";
			gMsg.err_type = 0;
			gMsg.err_txt = "";
			gMsg.payload = "";
			gMsg.options = options;
			payload = gMsg.serialise();

			console.log("golgi_send_msg payload:");
			console.log(payload);
			ntlConn.sendNtlReq(function(rc, rcStr, payload){
				console.log("Sending message: " + rc + "/" + rcStr);
			}, "golgi_send_msg", payload);
		};

		var keys = Object.keys(_inst);

		for(var i = 0; i < keys.length; i++){
			// console.log("Key[" + i + "]: '" + keys[i] + "'");
			GolgiNet[keys[i]] = _inst[keys[i]];
		}

	},
	
};

/* IS_AUTOGENERATED_SO_ALLOW_AUTODELETE=YES */
/* The previous line is to allow auto deletion */

var GolgiApi = {
    GolgiException : function(isSetDefault) {
        var _inst = {};
    
        _inst.GOLGI_TEST_CONST_STRING = "Mary had a little lamb";
        _inst.GOLGI_ERRTYPE_INCORRECT_JSON = 7902;
        _inst.GOLGI_ERRTYPE_MALFORMED_JSON = 7901;
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = GolgiApi.GolgiException();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var errTextIsSet = false;
        var errText = "";
        var errTypeIsSet = false;
        var errType = 0;
        _inst.getErrText = function(){
            return errText;
        }
        
        _inst.errTextIsSet = function(){
            return errTextIsSet;
        }
        
        _inst.setErrText = function(_value){
            errText = _value;
            errTextIsSet = true;
        }
        
        _inst.getErrType = function(){
            return errType;
        }
        
        _inst.errTypeIsSet = function(){
            return errTypeIsSet;
        }
        
        _inst.setErrType = function(_value){
            errType = _value;
            errTypeIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(errTextIsSet){
                sb += _comma + GolgiLib.genJSONTag("errText") + GolgiLib.encodeJSString(errText);
                _comma = ",";
            }
            if(errTypeIsSet){
                sb += _comma + GolgiLib.genJSONTag("errType") + errType;
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(errTextIsSet){
                sb = sb + GolgiLib.encodeString(prefix + "1", errText);
            }
            
            if(errTypeIsSet){
                sb = sb + prefix + "2: " + errType+"\n";
            }
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var l = payload.getLineForKey("1");
            if(l != undefined){
                errText = GolgiLib.decodeString(l);
                if(errText != undefined){
                    errTextIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
            var l = payload.getLineForKey("2");
            if(l != undefined){
                errType = parseInt(l);
                if(errType != NaN){
                    errTypeIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        errTextIsSet = isSetDefault;
        errTypeIsSet = isSetDefault;
        errType = 0;
    
        return _inst;
    },
    
};
/* IS_AUTOGENERATED_SO_ALLOW_AUTODELETE=YES */
/* The previous line is to allow auto deletion */

var SimpleString = {
    SSArg : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = SimpleString.SSArg();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var strIsSet = false;
        var str = "";
        _inst.getStr = function(){
            return str;
        }
        
        _inst.strIsSet = function(){
            return strIsSet;
        }
        
        _inst.setStr = function(_value){
            str = _value;
            strIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(strIsSet){
                sb += _comma + GolgiLib.genJSONTag("str") + GolgiLib.encodeJSString(str);
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(strIsSet){
                sb = sb + GolgiLib.encodeString(prefix + "1", str);
            }
            
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var l = payload.getLineForKey("1");
            if(l == undefined) corrupt = true;
            if(l != undefined){
                str = GolgiLib.decodeString(l);
                if(str != undefined){
                    strIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        strIsSet = isSetDefault;
    
        return _inst;
    },
    
    SSResult : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = SimpleString.SSResult();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var strIsSet = false;
        var str = "";
        _inst.getStr = function(){
            return str;
        }
        
        _inst.strIsSet = function(){
            return strIsSet;
        }
        
        _inst.setStr = function(_value){
            str = _value;
            strIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(strIsSet){
                sb += _comma + GolgiLib.genJSONTag("str") + GolgiLib.encodeJSString(str);
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(strIsSet){
                sb = sb + GolgiLib.encodeString(prefix + "1", str);
            }
            
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var l = payload.getLineForKey("1");
            if(l == undefined) corrupt = true;
            if(l != undefined){
                str = GolgiLib.decodeString(l);
                if(str != undefined){
                    strIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        strIsSet = isSetDefault;
    
        return _inst;
    },
    
    SimpleStringException : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = SimpleString.SimpleStringException();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var errorTextIsSet = false;
        var errorText = "";
        _inst.getErrorText = function(){
            return errorText;
        }
        
        _inst.errorTextIsSet = function(){
            return errorTextIsSet;
        }
        
        _inst.setErrorText = function(_value){
            errorText = _value;
            errorTextIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(errorTextIsSet){
                sb += _comma + GolgiLib.genJSONTag("errorText") + GolgiLib.encodeJSString(errorText);
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(errorTextIsSet){
                sb = sb + GolgiLib.encodeString(prefix + "1", errorText);
            }
            
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var l = payload.getLineForKey("1");
            if(l != undefined){
                errorText = GolgiLib.decodeString(l);
                if(errorText != undefined){
                    errorTextIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        errorTextIsSet = isSetDefault;
    
        return _inst;
    },
    
    SimpleString_sendString_reqArg : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = SimpleString.SimpleString_sendString_reqArg();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var argIsSet = false;
        var arg = SimpleString.SSArg(isSetDefault);
        _inst.getArg = function(){
            return arg;
        }
        
        _inst.argIsSet = function(){
            return argIsSet;
        }
        
        _inst.setArg = function(_value){
            arg = _value;
            argIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(argIsSet){
                sb += _comma + arg.toJSON();
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(argIsSet){
                sb = arg.serialise(prefix + "1." , sb);
            }
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var np = payload.getNestedForKey("1");
            if(np == undefined) corrupt = true;
            if(np != undefined){
                arg = SimpleString.SSArg(false);
                arg.deserialise(np);
                if(!arg.isCorrupt()){
                    argIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        argIsSet = isSetDefault;
    
        return _inst;
    },
    
    SimpleString_sendString_rspArg : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = SimpleString.SimpleString_sendString_rspArg();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var internalSuccess_IsSet = false;
        var internalSuccess_ = 0;
        var resultIsSet = false;
        var result = SimpleString.SSResult(isSetDefault);
        var golgiExceptionIsSet = false;
        var golgiException = GolgiApi.GolgiException(isSetDefault);
        var sseIsSet = false;
        var sse = SimpleString.SimpleStringException(isSetDefault);
        _inst.getInternalSuccess_ = function(){
            return internalSuccess_;
        }
        
        _inst.internalSuccess_IsSet = function(){
            return internalSuccess_IsSet;
        }
        
        _inst.setInternalSuccess_ = function(_value){
            internalSuccess_ = _value;
            internalSuccess_IsSet = true;
        }
        
        _inst.getResult = function(){
            return result;
        }
        
        _inst.resultIsSet = function(){
            return resultIsSet;
        }
        
        _inst.setResult = function(_value){
            result = _value;
            resultIsSet = true;
        }
        
        _inst.getGolgiException = function(){
            return golgiException;
        }
        
        _inst.golgiExceptionIsSet = function(){
            return golgiExceptionIsSet;
        }
        
        _inst.setGolgiException = function(_value){
            golgiException = _value;
            golgiExceptionIsSet = true;
        }
        
        _inst.getSse = function(){
            return sse;
        }
        
        _inst.sseIsSet = function(){
            return sseIsSet;
        }
        
        _inst.setSse = function(_value){
            sse = _value;
            sseIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(internalSuccess_IsSet){
                sb += _comma + GolgiLib.genJSONTag("internalSuccess_") + internalSuccess_;
                _comma = ",";
            }
            if(resultIsSet){
                sb += _comma + result.toJSON();
                _comma = ",";
            }
            if(golgiExceptionIsSet){
                sb += _comma + golgiException.toJSON();
                _comma = ",";
            }
            if(sseIsSet){
                sb += _comma + sse.toJSON();
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(internalSuccess_IsSet){
                sb = sb + prefix + "1: " + internalSuccess_+"\n";
            }
            if(resultIsSet){
                sb = result.serialise(prefix + "2." , sb);
            }
            if(golgiExceptionIsSet){
                sb = golgiException.serialise(prefix + "3." , sb);
            }
            if(sseIsSet){
                sb = sse.serialise(prefix + "4." , sb);
            }
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var l = payload.getLineForKey("1");
            if(l != undefined){
                internalSuccess_ = parseInt(l);
                if(internalSuccess_ != NaN){
                    internalSuccess_IsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
            var np = payload.getNestedForKey("2");
            if(np != undefined){
                result = SimpleString.SSResult(false);
                result.deserialise(np);
                if(!result.isCorrupt()){
                    resultIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
            var np = payload.getNestedForKey("3");
            if(np != undefined){
                golgiException = GolgiApi.GolgiException(false);
                golgiException.deserialise(np);
                if(!golgiException.isCorrupt()){
                    golgiExceptionIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
            var np = payload.getNestedForKey("4");
            if(np != undefined){
                sse = SimpleString.SimpleStringException(false);
                sse.deserialise(np);
                if(!sse.isCorrupt()){
                    sseIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        internalSuccess_IsSet = isSetDefault;
        internalSuccess_ = 0;
        resultIsSet = isSetDefault;
        golgiExceptionIsSet = isSetDefault;
        sseIsSet = isSetDefault;
    
        return _inst;
    },
    
    ServiceInit : function(){
        var _SimpleStringSvc = function(){
            var _inst = {};
            _inst.userLandHash = {};
    
            //
            //
            // Add code for sendString
            //
            //
            _inst.registerSendStringHandler = function(cb){
                _inst.userLandHash["sendString"] = cb;
            };
            _inst.sendStringResCb = function(arg){
                console.log("Ok, sendStringResCB called");
            };
    
            _inst.sendStringResNtlCb = function(arg){
                var _cb = {};
                _cb.arg = arg;
    
                _cb.success = function(rc, rcStr){
                }
    
                _cb.fail = function(rc, rcStr){
                    console.log("NTL(for res): fail (" + rc + "/" + rcStr + ")");
                }
    
                return _cb;
            };
    
            _inst.allocSendStringResultHandler = function(gMsg){
                var _h = {};
                _h.gMsg = gMsg;
                _h.getRequestSenderId = function(){
                    return _h.gMsg.oa_app_user_id;
                }
                _h.success = function(result){
                    var _r =    SimpleString.SimpleString_sendString_rspArg();
                    _r.setInternalSuccess_(1);
                    _r.setResult(result);
                    GolgiNet.sendRes(_inst.sendStringResNtlCb(), gMsg.message_id, "sendString.SimpleString", _h.gMsg.oa_app_user_id, undefined, _r);
                };
                //
                // Name = golgiException
                // Type = GolgiException
                //
                _h.failWithGolgiException = function(err){
                    var _r =    SimpleString.SimpleString_sendString_rspArg();
                    _r.setInternalSuccess_(false);
                    _r.setGolgiException(err);
                    GolgiNet.sendRes(_inst.sendStringResNtlCb(), gMsg.message_id, "sendString.SimpleString", _h.gMsg.oa_app_user_id, undefined, _r);
                };
                //
                // Name = sse
                // Type = SimpleStringException
                //
                _h.failWithSse = function(err){
                    var _r =    SimpleString.SimpleString_sendString_rspArg();
                    _r.setInternalSuccess_(false);
                    _r.setSse(err);
                    GolgiNet.sendRes(_inst.sendStringResNtlCb(), gMsg.message_id, "sendString.SimpleString", _h.gMsg.oa_app_user_id, undefined, _r);
                };
                return _h;
            };
    
            _inst.sendStringReqGolgiCb = function(reqArg){
                var _state = {};
                var _userCb = reqArg.__cb;
                _state.errArrived = function(errType, errText){
                    var golgiException = GolgiApi.GolgiException();
                    golgiException.setErrType(errType);
                    golgiException.setErrText(errText);
                    _userCb.failWithGolgiException(golgiException);
                };
                _state.resArrived = function(gMsg){
                    var resArg = SimpleString.SimpleString_sendString_rspArg();
                    var str = gMsg.payload;
                    resArg.deserialise(GolgiLib.Payload(str));
                    if(resArg.isCorrupt()){
                        console.log("Corrupted res arrived for 'sendString'");
                    }
                    else if(resArg.getInternalSuccess_()){
                        _userCb.success(resArg.getResult());
                    }
                    else if(resArg.golgiExceptionIsSet()){
                        // Type: GolgiException
                        // Name: golgiException
                        _userCb.failWithGolgiException(resArg.getGolgiException());
                    }
                    else if(resArg.sseIsSet()){
                        // Type: SimpleStringException
                        // Name: sse
                        _userCb.failWithSse(resArg.getSse());
                    }
                    else{
                        console.log("Hmmm, noting set in RES for 'sendString'" + resArg.getInternalSuccess_());
                    }
                };
                return _state;
            };
    
            _inst.sendStringReqNtlCb = function(arg){
                var _cb = {};
                _cb.arg = arg;
                _cb.success = function(rc, rcStr){
                }
                _cb.fail = function(rc, rcStr){
                    console.log("NTL: fail (" + rc + "/" + rcStr + ") sendString");
                }
                return _cb;
            };
    
            _inst.inboundSendString = function(ntlCb, gMsg){
                var handler = _inst.allocSendStringResultHandler(gMsg);
                var corruptArgs = false;
                r = SimpleString.SimpleString_sendString_reqArg();
                r.deserialise(GolgiLib.Payload(gMsg.payload));
                corruptArgs = r.isCorrupt();
                if(corruptArgs){
                    // Generate a GolgiException and throw back
                    gex = GolgiApi.GolgiException();
                    gex.setErrType(12345);
                    gex.setErrText("Garbled payload at recipient endpoint");
                    handler.failWithGolgiException(gex);
                }
                else{
                    // Pass each argument out to the register user func
                    var userLand = _inst.userLandHash["sendString"];
                    if(userLand == undefined){
                        // Generate a GolgiException and throw back
                        gex = GolgiApi.GolgiException();
                        gex.setErrType(67890);
                        gex.setErrText("No handler installed at recipient endpoint");
                        handler.failWithGolgiException(gex);
                    }
                    else{
                        userLand(handler, r.getArg());
                    }
                }
                ntlCb(300, "OK");
            };
            _inst.sendString = function(cb, dst, options, arg){
                var arg = SimpleString.SimpleString_sendString_reqArg();
                arg.setArg(arg);
                arg.__cb = cb;
                GolgiNet.sendReq(_inst.sendStringReqGolgiCb(arg),
                                 _inst.sendStringReqNtlCb(arg),
                                 "sendString.SimpleString",
                                 dst,
                                 options,
                                 arg);
            };
            GolgiNet.registerGolgiMessageHandler("sendString.SimpleString", _inst.inboundSendString);
            return _inst;
        };
        SimpleString.SimpleStringSvc = _SimpleStringSvc();
    },
};
var Golgi = {
	init : function(){
		var _inst = {};
		_inst.GolgiLib = GolgiLib.init();
		_inst.GolgiNet = GolgiNet.init();
	}
};//
// Not written yet
//


var NTLConnImpl = function(_ntlConn){
	var _inst = {}
	var conn;
	var ntlConn = _ntlConn;
	var host;
	var port;
    var ws;
			
	var dataCallback = function(evt) {
		ntlConn.dataCallback(evt.data);
	};
			
	var closeCallback = function(){
		ntlConn.closeCallback();
	};
			
	_inst.write = function(str){
		ws.send(str);
	}
	
	_inst.connect = function(_port, _host){
		host = _host;
		port = _port;
		
		console.log("Connecting to '" + host + "'/" + port);
		
		
		ws = new WebSocket("wss://gws.o17g.com");
		
		ws.onopen = function(){
			console.log('Connected');
			ws.send(host + ":" + port);
		};
		
		ws.onmessage = dataCallback;
		ws.onclose = closeCallback;
	}
	
	return _inst;
};

/* IS_AUTOGENERATED_SO_ALLOW_AUTODELETE=YES */
/* The previous line is to allow auto deletion */

var DaqriGolgi = {
    SentronRequest : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = DaqriGolgi.SentronRequest();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var indexIsSet = false;
        var index = 0;
        var numberRegistersIsSet = false;
        var numberRegisters = 0;
        _inst.getIndex = function(){
            return index;
        }
        
        _inst.indexIsSet = function(){
            return indexIsSet;
        }
        
        _inst.setIndex = function(_value){
            index = _value;
            indexIsSet = true;
        }
        
        _inst.getNumberRegisters = function(){
            return numberRegisters;
        }
        
        _inst.numberRegistersIsSet = function(){
            return numberRegistersIsSet;
        }
        
        _inst.setNumberRegisters = function(_value){
            numberRegisters = _value;
            numberRegistersIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(indexIsSet){
                sb += _comma + GolgiLib.genJSONTag("index") + index;
                _comma = ",";
            }
            if(numberRegistersIsSet){
                sb += _comma + GolgiLib.genJSONTag("numberRegisters") + numberRegisters;
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(indexIsSet){
                sb = sb + prefix + "1: " + index+"\n";
            }
            if(numberRegistersIsSet){
                sb = sb + prefix + "2: " + numberRegisters+"\n";
            }
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var l = payload.getLineForKey("1");
            if(l == undefined) corrupt = true;
            if(l != undefined){
                index = parseInt(l);
                if(index != NaN){
                    indexIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
            var l = payload.getLineForKey("2");
            if(l == undefined) corrupt = true;
            if(l != undefined){
                numberRegisters = parseInt(l);
                if(numberRegisters != NaN){
                    numberRegistersIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        indexIsSet = isSetDefault;
        index = 0;
        numberRegistersIsSet = isSetDefault;
        numberRegisters = 0;
    
        return _inst;
    },
    
    SentronData : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = DaqriGolgi.SentronData();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var indexIsSet = false;
        var index = 0;
        var numberRegistersIsSet = false;
        var numberRegisters = 0;
        var registerDataIsSet = false;
        var registerData = new Uint8Array(new ArrayBuffer(0));
        _inst.getIndex = function(){
            return index;
        }
        
        _inst.indexIsSet = function(){
            return indexIsSet;
        }
        
        _inst.setIndex = function(_value){
            index = _value;
            indexIsSet = true;
        }
        
        _inst.getNumberRegisters = function(){
            return numberRegisters;
        }
        
        _inst.numberRegistersIsSet = function(){
            return numberRegistersIsSet;
        }
        
        _inst.setNumberRegisters = function(_value){
            numberRegisters = _value;
            numberRegistersIsSet = true;
        }
        
        _inst.getRegisterData = function(){
            return registerData;
        }
        
        _inst.registerDataIsSet = function(){
            return registerDataIsSet;
        }
        
        _inst.setRegisterData = function(_value){
            registerData = _value;
            registerDataIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(indexIsSet){
                sb += _comma + GolgiLib.genJSONTag("index") + index;
                _comma = ",";
            }
            if(numberRegistersIsSet){
                sb += _comma + GolgiLib.genJSONTag("numberRegisters") + numberRegisters;
                _comma = ",";
            }
            if(registerDataIsSet){
                sb += _comma + GolgiLib.genJSONTag("registerData") + "\"" + GolgiLib.encodeData(registerData) + "\"";
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(indexIsSet){
                sb = sb + prefix + "1: " + index+"\n";
            }
            if(numberRegistersIsSet){
                sb = sb + prefix + "2: " + numberRegisters+"\n";
            }
            if(registerDataIsSet){
                sb = sb + prefix + "3: " + GolgiLib.encodeData(registerData) + "\n";
            }
            
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var l = payload.getLineForKey("1");
            if(l == undefined) corrupt = true;
            if(l != undefined){
                index = parseInt(l);
                if(index != NaN){
                    indexIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
            var l = payload.getLineForKey("2");
            if(l == undefined) corrupt = true;
            if(l != undefined){
                numberRegisters = parseInt(l);
                if(numberRegisters != NaN){
                    numberRegistersIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
            var l = payload.getLineForKey("3");
            if(l == undefined) corrupt = true;
            if(l != undefined){
                registerData = GolgiLib.decodeData(l);
                if(registerData != undefined){
                    registerDataIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        indexIsSet = isSetDefault;
        index = 0;
        numberRegistersIsSet = isSetDefault;
        numberRegisters = 0;
        registerDataIsSet = isSetDefault;
    
        return _inst;
    },
    
    SentronReadException : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = DaqriGolgi.SentronReadException();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var errorIsSet = false;
        var error = "";
        _inst.getError = function(){
            return error;
        }
        
        _inst.errorIsSet = function(){
            return errorIsSet;
        }
        
        _inst.setError = function(_value){
            error = _value;
            errorIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(errorIsSet){
                sb += _comma + GolgiLib.genJSONTag("error") + GolgiLib.encodeJSString(error);
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(errorIsSet){
                sb = sb + GolgiLib.encodeString(prefix + "1", error);
            }
            
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var l = payload.getLineForKey("1");
            if(l == undefined) corrupt = true;
            if(l != undefined){
                error = GolgiLib.decodeString(l);
                if(error != undefined){
                    errorIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        errorIsSet = isSetDefault;
    
        return _inst;
    },
    
    DaqriNotification : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = DaqriGolgi.DaqriNotification();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var notIsSet = false;
        var not = "";
        _inst.getNot = function(){
            return not;
        }
        
        _inst.notIsSet = function(){
            return notIsSet;
        }
        
        _inst.setNot = function(_value){
            not = _value;
            notIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(notIsSet){
                sb += _comma + GolgiLib.genJSONTag("not") + GolgiLib.encodeJSString(not);
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(notIsSet){
                sb = sb + GolgiLib.encodeString(prefix + "1", not);
            }
            
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var l = payload.getLineForKey("1");
            if(l == undefined) corrupt = true;
            if(l != undefined){
                not = GolgiLib.decodeString(l);
                if(not != undefined){
                    notIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        notIsSet = isSetDefault;
    
        return _inst;
    },
    
    DaqriRegister : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = DaqriGolgi.DaqriRegister();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var uidIsSet = false;
        var uid = "";
        _inst.getUid = function(){
            return uid;
        }
        
        _inst.uidIsSet = function(){
            return uidIsSet;
        }
        
        _inst.setUid = function(_value){
            uid = _value;
            uidIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(uidIsSet){
                sb += _comma + GolgiLib.genJSONTag("uid") + GolgiLib.encodeJSString(uid);
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(uidIsSet){
                sb = sb + GolgiLib.encodeString(prefix + "1", uid);
            }
            
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var l = payload.getLineForKey("1");
            if(l == undefined) corrupt = true;
            if(l != undefined){
                uid = GolgiLib.decodeString(l);
                if(uid != undefined){
                    uidIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        uidIsSet = isSetDefault;
    
        return _inst;
    },
    
    Daqri_read_reqArg : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = DaqriGolgi.Daqri_read_reqArg();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var srIsSet = false;
        var sr = DaqriGolgi.SentronRequest(isSetDefault);
        _inst.getSr = function(){
            return sr;
        }
        
        _inst.srIsSet = function(){
            return srIsSet;
        }
        
        _inst.setSr = function(_value){
            sr = _value;
            srIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(srIsSet){
                sb += _comma + sr.toJSON();
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(srIsSet){
                sb = sr.serialise(prefix + "1." , sb);
            }
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var np = payload.getNestedForKey("1");
            if(np == undefined) corrupt = true;
            if(np != undefined){
                sr = DaqriGolgi.SentronRequest(false);
                sr.deserialise(np);
                if(!sr.isCorrupt()){
                    srIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        srIsSet = isSetDefault;
    
        return _inst;
    },
    
    Daqri_read_rspArg : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = DaqriGolgi.Daqri_read_rspArg();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var internalSuccess_IsSet = false;
        var internalSuccess_ = 0;
        var resultIsSet = false;
        var result = DaqriGolgi.SentronData(isSetDefault);
        var golgiExceptionIsSet = false;
        var golgiException = GolgiApi.GolgiException(isSetDefault);
        var sreIsSet = false;
        var sre = DaqriGolgi.SentronReadException(isSetDefault);
        _inst.getInternalSuccess_ = function(){
            return internalSuccess_;
        }
        
        _inst.internalSuccess_IsSet = function(){
            return internalSuccess_IsSet;
        }
        
        _inst.setInternalSuccess_ = function(_value){
            internalSuccess_ = _value;
            internalSuccess_IsSet = true;
        }
        
        _inst.getResult = function(){
            return result;
        }
        
        _inst.resultIsSet = function(){
            return resultIsSet;
        }
        
        _inst.setResult = function(_value){
            result = _value;
            resultIsSet = true;
        }
        
        _inst.getGolgiException = function(){
            return golgiException;
        }
        
        _inst.golgiExceptionIsSet = function(){
            return golgiExceptionIsSet;
        }
        
        _inst.setGolgiException = function(_value){
            golgiException = _value;
            golgiExceptionIsSet = true;
        }
        
        _inst.getSre = function(){
            return sre;
        }
        
        _inst.sreIsSet = function(){
            return sreIsSet;
        }
        
        _inst.setSre = function(_value){
            sre = _value;
            sreIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(internalSuccess_IsSet){
                sb += _comma + GolgiLib.genJSONTag("internalSuccess_") + internalSuccess_;
                _comma = ",";
            }
            if(resultIsSet){
                sb += _comma + result.toJSON();
                _comma = ",";
            }
            if(golgiExceptionIsSet){
                sb += _comma + golgiException.toJSON();
                _comma = ",";
            }
            if(sreIsSet){
                sb += _comma + sre.toJSON();
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(internalSuccess_IsSet){
                sb = sb + prefix + "1: " + internalSuccess_+"\n";
            }
            if(resultIsSet){
                sb = result.serialise(prefix + "2." , sb);
            }
            if(golgiExceptionIsSet){
                sb = golgiException.serialise(prefix + "3." , sb);
            }
            if(sreIsSet){
                sb = sre.serialise(prefix + "4." , sb);
            }
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var l = payload.getLineForKey("1");
            if(l != undefined){
                internalSuccess_ = parseInt(l);
                if(internalSuccess_ != NaN){
                    internalSuccess_IsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
            var np = payload.getNestedForKey("2");
            if(np != undefined){
                result = DaqriGolgi.SentronData(false);
                result.deserialise(np);
                if(!result.isCorrupt()){
                    resultIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
            var np = payload.getNestedForKey("3");
            if(np != undefined){
                golgiException = GolgiApi.GolgiException(false);
                golgiException.deserialise(np);
                if(!golgiException.isCorrupt()){
                    golgiExceptionIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
            var np = payload.getNestedForKey("4");
            if(np != undefined){
                sre = DaqriGolgi.SentronReadException(false);
                sre.deserialise(np);
                if(!sre.isCorrupt()){
                    sreIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        internalSuccess_IsSet = isSetDefault;
        internalSuccess_ = 0;
        resultIsSet = isSetDefault;
        golgiExceptionIsSet = isSetDefault;
        sreIsSet = isSetDefault;
    
        return _inst;
    },
    
    Daqri_register_reqArg : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = DaqriGolgi.Daqri_register_reqArg();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var drIsSet = false;
        var dr = DaqriGolgi.DaqriRegister(isSetDefault);
        _inst.getDr = function(){
            return dr;
        }
        
        _inst.drIsSet = function(){
            return drIsSet;
        }
        
        _inst.setDr = function(_value){
            dr = _value;
            drIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(drIsSet){
                sb += _comma + dr.toJSON();
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(drIsSet){
                sb = dr.serialise(prefix + "1." , sb);
            }
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var np = payload.getNestedForKey("1");
            if(np == undefined) corrupt = true;
            if(np != undefined){
                dr = DaqriGolgi.DaqriRegister(false);
                dr.deserialise(np);
                if(!dr.isCorrupt()){
                    drIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        drIsSet = isSetDefault;
    
        return _inst;
    },
    
    Daqri_register_rspArg : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = DaqriGolgi.Daqri_register_rspArg();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var internalSuccess_IsSet = false;
        var internalSuccess_ = 0;
        var golgiExceptionIsSet = false;
        var golgiException = GolgiApi.GolgiException(isSetDefault);
        _inst.getInternalSuccess_ = function(){
            return internalSuccess_;
        }
        
        _inst.internalSuccess_IsSet = function(){
            return internalSuccess_IsSet;
        }
        
        _inst.setInternalSuccess_ = function(_value){
            internalSuccess_ = _value;
            internalSuccess_IsSet = true;
        }
        
        _inst.getGolgiException = function(){
            return golgiException;
        }
        
        _inst.golgiExceptionIsSet = function(){
            return golgiExceptionIsSet;
        }
        
        _inst.setGolgiException = function(_value){
            golgiException = _value;
            golgiExceptionIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(internalSuccess_IsSet){
                sb += _comma + GolgiLib.genJSONTag("internalSuccess_") + internalSuccess_;
                _comma = ",";
            }
            if(golgiExceptionIsSet){
                sb += _comma + golgiException.toJSON();
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(internalSuccess_IsSet){
                sb = sb + prefix + "1: " + internalSuccess_+"\n";
            }
            if(golgiExceptionIsSet){
                sb = golgiException.serialise(prefix + "3." , sb);
            }
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var l = payload.getLineForKey("1");
            if(l != undefined){
                internalSuccess_ = parseInt(l);
                if(internalSuccess_ != NaN){
                    internalSuccess_IsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
            var np = payload.getNestedForKey("3");
            if(np != undefined){
                golgiException = GolgiApi.GolgiException(false);
                golgiException.deserialise(np);
                if(!golgiException.isCorrupt()){
                    golgiExceptionIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        internalSuccess_IsSet = isSetDefault;
        internalSuccess_ = 0;
        golgiExceptionIsSet = isSetDefault;
    
        return _inst;
    },
    
    Daqri_notify_reqArg : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = DaqriGolgi.Daqri_notify_reqArg();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var dnIsSet = false;
        var dn = DaqriGolgi.DaqriNotification(isSetDefault);
        _inst.getDn = function(){
            return dn;
        }
        
        _inst.dnIsSet = function(){
            return dnIsSet;
        }
        
        _inst.setDn = function(_value){
            dn = _value;
            dnIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(dnIsSet){
                sb += _comma + dn.toJSON();
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(dnIsSet){
                sb = dn.serialise(prefix + "1." , sb);
            }
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var np = payload.getNestedForKey("1");
            if(np == undefined) corrupt = true;
            if(np != undefined){
                dn = DaqriGolgi.DaqriNotification(false);
                dn.deserialise(np);
                if(!dn.isCorrupt()){
                    dnIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        dnIsSet = isSetDefault;
    
        return _inst;
    },
    
    Daqri_notify_rspArg : function(isSetDefault) {
        var _inst = {};
    
        if(isSetDefault == undefined) isSetDefault = true;
    
        var _corrupt = false;
    
        _inst.dupe = function(){
            var dupedInst = DaqriGolgi.Daqri_notify_rspArg();
            dupedInst.deserialise(GolgiLib.Payload(_inst.serialise()));
            return dupedInst;
        }
        _inst.isCorrupt = function(){
            return _corrupt;
        }
    
        var internalSuccess_IsSet = false;
        var internalSuccess_ = 0;
        var golgiExceptionIsSet = false;
        var golgiException = GolgiApi.GolgiException(isSetDefault);
        _inst.getInternalSuccess_ = function(){
            return internalSuccess_;
        }
        
        _inst.internalSuccess_IsSet = function(){
            return internalSuccess_IsSet;
        }
        
        _inst.setInternalSuccess_ = function(_value){
            internalSuccess_ = _value;
            internalSuccess_IsSet = true;
        }
        
        _inst.getGolgiException = function(){
            return golgiException;
        }
        
        _inst.golgiExceptionIsSet = function(){
            return golgiExceptionIsSet;
        }
        
        _inst.setGolgiException = function(_value){
            golgiException = _value;
            golgiExceptionIsSet = true;
        }
        
        _inst.toJSON = function(sb){
            var _comma = "";
            if(sb == undefined) sb = "";
    
            sb = sb + "{";
            if(internalSuccess_IsSet){
                sb += _comma + GolgiLib.genJSONTag("internalSuccess_") + internalSuccess_;
                _comma = ",";
            }
            if(golgiExceptionIsSet){
                sb += _comma + golgiException.toJSON();
                _comma = ",";
            }
    
            sb = sb + "}";
    
            return sb;
        }
    
        _inst.serialise = function(prefix, sb){
            if(prefix == undefined) prefix = "";
            if(sb == undefined) sb = "";
    
            if(internalSuccess_IsSet){
                sb = sb + prefix + "1: " + internalSuccess_+"\n";
            }
            if(golgiExceptionIsSet){
                sb = golgiException.serialise(prefix + "3." , sb);
            }
    
            return sb;
        }
    
        _inst.deserialise = function(payload){
    
            var l = payload.getLineForKey("1");
            if(l != undefined){
                internalSuccess_ = parseInt(l);
                if(internalSuccess_ != NaN){
                    internalSuccess_IsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
            var np = payload.getNestedForKey("3");
            if(np != undefined){
                golgiException = GolgiApi.GolgiException(false);
                golgiException.deserialise(np);
                if(!golgiException.isCorrupt()){
                    golgiExceptionIsSet = true;
                }
                else{
                    _corrupt = true;
                }
            }
            
    
        }
    
        internalSuccess_IsSet = isSetDefault;
        internalSuccess_ = 0;
        golgiExceptionIsSet = isSetDefault;
    
        return _inst;
    },
    
    ServiceInit : function(){
        var _DaqriSvc = function(){
            var _inst = {};
            _inst.userLandHash = {};
    
            //
            //
            // Add code for read
            //
            //
            _inst.registerReadHandler = function(cb){
                _inst.userLandHash["read"] = cb;
            };
            _inst.readResCb = function(arg){
                console.log("Ok, readResCB called");
            };
    
            _inst.readResNtlCb = function(arg){
                var _cb = {};
                _cb.arg = arg;
    
                _cb.success = function(rc, rcStr){
                }
    
                _cb.fail = function(rc, rcStr){
                    console.log("NTL(for res): fail (" + rc + "/" + rcStr + ")");
                }
    
                return _cb;
            };
    
            _inst.allocReadResultHandler = function(gMsg){
                var _h = {};
                _h.gMsg = gMsg;
                _h.getRequestSenderId = function(){
                    return _h.gMsg.oa_app_user_id;
                }
                _h.success = function(result){
                    var _r =    DaqriGolgi.Daqri_read_rspArg();
                    _r.setInternalSuccess_(1);
                    _r.setResult(result);
                    GolgiNet.sendRes(_inst.readResNtlCb(), gMsg.message_id, "read.Daqri", _h.gMsg.oa_app_user_id, undefined, _r);
                };
                //
                // Name = golgiException
                // Type = GolgiException
                //
                _h.failWithGolgiException = function(err){
                    var _r =    DaqriGolgi.Daqri_read_rspArg();
                    _r.setInternalSuccess_(false);
                    _r.setGolgiException(err);
                    GolgiNet.sendRes(_inst.readResNtlCb(), gMsg.message_id, "read.Daqri", _h.gMsg.oa_app_user_id, undefined, _r);
                };
                //
                // Name = sre
                // Type = SentronReadException
                //
                _h.failWithSre = function(err){
                    var _r =    DaqriGolgi.Daqri_read_rspArg();
                    _r.setInternalSuccess_(false);
                    _r.setSre(err);
                    GolgiNet.sendRes(_inst.readResNtlCb(), gMsg.message_id, "read.Daqri", _h.gMsg.oa_app_user_id, undefined, _r);
                };
                return _h;
            };
    
            _inst.readReqGolgiCb = function(reqArg){
                var _state = {};
                var _userCb = reqArg.__cb;
                _state.errArrived = function(errType, errText){
                    var golgiException = GolgiApi.GolgiException();
                    golgiException.setErrType(errType);
                    golgiException.setErrText(errText);
                    _userCb.failWithGolgiException(golgiException);
                };
                _state.resArrived = function(gMsg){
                    var resArg = DaqriGolgi.Daqri_read_rspArg();
                    var str = gMsg.payload;
                    resArg.deserialise(GolgiLib.Payload(str));
                    if(resArg.isCorrupt()){
                        console.log("Corrupted res arrived for 'read'");
                    }
                    else if(resArg.getInternalSuccess_()){
                        _userCb.success(resArg.getResult());
                    }
                    else if(resArg.golgiExceptionIsSet()){
                        // Type: GolgiException
                        // Name: golgiException
                        _userCb.failWithGolgiException(resArg.getGolgiException());
                    }
                    else if(resArg.sreIsSet()){
                        // Type: SentronReadException
                        // Name: sre
                        _userCb.failWithSre(resArg.getSre());
                    }
                    else{
                        console.log("Hmmm, noting set in RES for 'read'" + resArg.getInternalSuccess_());
                    }
                };
                return _state;
            };
    
            _inst.readReqNtlCb = function(arg){
                var _cb = {};
                _cb.arg = arg;
                _cb.success = function(rc, rcStr){
                }
                _cb.fail = function(rc, rcStr){
                    console.log("NTL: fail (" + rc + "/" + rcStr + ") read");
                }
                return _cb;
            };
    
            _inst.inboundRead = function(ntlCb, gMsg){
                var handler = _inst.allocReadResultHandler(gMsg);
                var corruptArgs = false;
                r = DaqriGolgi.Daqri_read_reqArg();
                r.deserialise(GolgiLib.Payload(gMsg.payload));
                corruptArgs = r.isCorrupt();
                if(corruptArgs){
                    // Generate a GolgiException and throw back
                    gex = GolgiApi.GolgiException();
                    gex.setErrType(12345);
                    gex.setErrText("Garbled payload at recipient endpoint");
                    handler.failWithGolgiException(gex);
                }
                else{
                    // Pass each argument out to the register user func
                    var userLand = _inst.userLandHash["read"];
                    if(userLand == undefined){
                        // Generate a GolgiException and throw back
                        gex = GolgiApi.GolgiException();
                        gex.setErrType(67890);
                        gex.setErrText("No handler installed at recipient endpoint");
                        handler.failWithGolgiException(gex);
                    }
                    else{
                        userLand(handler, r.getSr());
                    }
                }
                ntlCb(300, "OK");
            };
            _inst.read = function(cb, dst, options, sr){
                var arg = DaqriGolgi.Daqri_read_reqArg();
                arg.setSr(sr);
                arg.__cb = cb;
                GolgiNet.sendReq(_inst.readReqGolgiCb(arg),
                                 _inst.readReqNtlCb(arg),
                                 "read.Daqri",
                                 dst,
                                 options,
                                 arg);
            };
            GolgiNet.registerGolgiMessageHandler("read.Daqri", _inst.inboundRead);
    
            //
            //
            // Add code for register
            //
            //
            _inst.registerRegisterHandler = function(cb){
                _inst.userLandHash["register"] = cb;
            };
            _inst.registerResCb = function(arg){
                console.log("Ok, registerResCB called");
            };
    
            _inst.registerResNtlCb = function(arg){
                var _cb = {};
                _cb.arg = arg;
    
                _cb.success = function(rc, rcStr){
                }
    
                _cb.fail = function(rc, rcStr){
                    console.log("NTL(for res): fail (" + rc + "/" + rcStr + ")");
                }
    
                return _cb;
            };
    
            _inst.allocRegisterResultHandler = function(gMsg){
                var _h = {};
                _h.gMsg = gMsg;
                _h.getRequestSenderId = function(){
                    return _h.gMsg.oa_app_user_id;
                }
                _h.success = function(){
                    var _r =    DaqriGolgi.Daqri_register_rspArg();
                    _r.setInternalSuccess_(1);
                    GolgiNet.sendRes(_inst.registerResNtlCb(), gMsg.message_id, "register.Daqri", _h.gMsg.oa_app_user_id, undefined, _r);
                };
                //
                // Name = golgiException
                // Type = GolgiException
                //
                _h.failWithGolgiException = function(err){
                    var _r =    DaqriGolgi.Daqri_register_rspArg();
                    _r.setInternalSuccess_(false);
                    _r.setGolgiException(err);
                    GolgiNet.sendRes(_inst.registerResNtlCb(), gMsg.message_id, "register.Daqri", _h.gMsg.oa_app_user_id, undefined, _r);
                };
                return _h;
            };
    
            _inst.registerReqGolgiCb = function(reqArg){
                var _state = {};
                var _userCb = reqArg.__cb;
                _state.errArrived = function(errType, errText){
                    var golgiException = GolgiApi.GolgiException();
                    golgiException.setErrType(errType);
                    golgiException.setErrText(errText);
                    _userCb.failWithGolgiException(golgiException);
                };
                _state.resArrived = function(gMsg){
                    var resArg = DaqriGolgi.Daqri_register_rspArg();
                    var str = gMsg.payload;
                    resArg.deserialise(GolgiLib.Payload(str));
                    if(resArg.isCorrupt()){
                        console.log("Corrupted res arrived for 'register'");
                    }
                    else if(resArg.getInternalSuccess_()){
                        _userCb.success();
                    }
                    else if(resArg.golgiExceptionIsSet()){
                        // Type: GolgiException
                        // Name: golgiException
                        _userCb.failWithGolgiException(resArg.getGolgiException());
                    }
                    else{
                        console.log("Hmmm, noting set in RES for 'register'" + resArg.getInternalSuccess_());
                    }
                };
                return _state;
            };
    
            _inst.registerReqNtlCb = function(arg){
                var _cb = {};
                _cb.arg = arg;
                _cb.success = function(rc, rcStr){
                }
                _cb.fail = function(rc, rcStr){
                    console.log("NTL: fail (" + rc + "/" + rcStr + ") register");
                }
                return _cb;
            };
    
            _inst.inboundRegister = function(ntlCb, gMsg){
                var handler = _inst.allocRegisterResultHandler(gMsg);
                var corruptArgs = false;
                r = DaqriGolgi.Daqri_register_reqArg();
                r.deserialise(GolgiLib.Payload(gMsg.payload));
                corruptArgs = r.isCorrupt();
                if(corruptArgs){
                    // Generate a GolgiException and throw back
                    gex = GolgiApi.GolgiException();
                    gex.setErrType(12345);
                    gex.setErrText("Garbled payload at recipient endpoint");
                    handler.failWithGolgiException(gex);
                }
                else{
                    // Pass each argument out to the register user func
                    var userLand = _inst.userLandHash["register"];
                    if(userLand == undefined){
                        // Generate a GolgiException and throw back
                        gex = GolgiApi.GolgiException();
                        gex.setErrType(67890);
                        gex.setErrText("No handler installed at recipient endpoint");
                        handler.failWithGolgiException(gex);
                    }
                    else{
                        userLand(handler, r.getDr());
                    }
                }
                ntlCb(300, "OK");
            };
            _inst.register = function(cb, dst, options, dr){
                var arg = DaqriGolgi.Daqri_register_reqArg();
                arg.setDr(dr);
                arg.__cb = cb;
                GolgiNet.sendReq(_inst.registerReqGolgiCb(arg),
                                 _inst.registerReqNtlCb(arg),
                                 "register.Daqri",
                                 dst,
                                 options,
                                 arg);
            };
            GolgiNet.registerGolgiMessageHandler("register.Daqri", _inst.inboundRegister);
    
            //
            //
            // Add code for notify
            //
            //
            _inst.registerNotifyHandler = function(cb){
                _inst.userLandHash["notify"] = cb;
            };
            _inst.notifyResCb = function(arg){
                console.log("Ok, notifyResCB called");
            };
    
            _inst.notifyResNtlCb = function(arg){
                var _cb = {};
                _cb.arg = arg;
    
                _cb.success = function(rc, rcStr){
                }
    
                _cb.fail = function(rc, rcStr){
                    console.log("NTL(for res): fail (" + rc + "/" + rcStr + ")");
                }
    
                return _cb;
            };
    
            _inst.allocNotifyResultHandler = function(gMsg){
                var _h = {};
                _h.gMsg = gMsg;
                _h.getRequestSenderId = function(){
                    return _h.gMsg.oa_app_user_id;
                }
                _h.success = function(){
                    var _r =    DaqriGolgi.Daqri_notify_rspArg();
                    _r.setInternalSuccess_(1);
                    GolgiNet.sendRes(_inst.notifyResNtlCb(), gMsg.message_id, "notify.Daqri", _h.gMsg.oa_app_user_id, undefined, _r);
                };
                //
                // Name = golgiException
                // Type = GolgiException
                //
                _h.failWithGolgiException = function(err){
                    var _r =    DaqriGolgi.Daqri_notify_rspArg();
                    _r.setInternalSuccess_(false);
                    _r.setGolgiException(err);
                    GolgiNet.sendRes(_inst.notifyResNtlCb(), gMsg.message_id, "notify.Daqri", _h.gMsg.oa_app_user_id, undefined, _r);
                };
                return _h;
            };
    
            _inst.notifyReqGolgiCb = function(reqArg){
                var _state = {};
                var _userCb = reqArg.__cb;
                _state.errArrived = function(errType, errText){
                    var golgiException = GolgiApi.GolgiException();
                    golgiException.setErrType(errType);
                    golgiException.setErrText(errText);
                    _userCb.failWithGolgiException(golgiException);
                };
                _state.resArrived = function(gMsg){
                    var resArg = DaqriGolgi.Daqri_notify_rspArg();
                    var str = gMsg.payload;
                    resArg.deserialise(GolgiLib.Payload(str));
                    if(resArg.isCorrupt()){
                        console.log("Corrupted res arrived for 'notify'");
                    }
                    else if(resArg.getInternalSuccess_()){
                        _userCb.success();
                    }
                    else if(resArg.golgiExceptionIsSet()){
                        // Type: GolgiException
                        // Name: golgiException
                        _userCb.failWithGolgiException(resArg.getGolgiException());
                    }
                    else{
                        console.log("Hmmm, noting set in RES for 'notify'" + resArg.getInternalSuccess_());
                    }
                };
                return _state;
            };
    
            _inst.notifyReqNtlCb = function(arg){
                var _cb = {};
                _cb.arg = arg;
                _cb.success = function(rc, rcStr){
                }
                _cb.fail = function(rc, rcStr){
                    console.log("NTL: fail (" + rc + "/" + rcStr + ") notify");
                }
                return _cb;
            };
    
            _inst.inboundNotify = function(ntlCb, gMsg){
                var handler = _inst.allocNotifyResultHandler(gMsg);
                var corruptArgs = false;
                r = DaqriGolgi.Daqri_notify_reqArg();
                r.deserialise(GolgiLib.Payload(gMsg.payload));
                corruptArgs = r.isCorrupt();
                if(corruptArgs){
                    // Generate a GolgiException and throw back
                    gex = GolgiApi.GolgiException();
                    gex.setErrType(12345);
                    gex.setErrText("Garbled payload at recipient endpoint");
                    handler.failWithGolgiException(gex);
                }
                else{
                    // Pass each argument out to the register user func
                    var userLand = _inst.userLandHash["notify"];
                    if(userLand == undefined){
                        // Generate a GolgiException and throw back
                        gex = GolgiApi.GolgiException();
                        gex.setErrType(67890);
                        gex.setErrText("No handler installed at recipient endpoint");
                        handler.failWithGolgiException(gex);
                    }
                    else{
                        userLand(handler, r.getDn());
                    }
                }
                ntlCb(300, "OK");
            };
            _inst.notify = function(cb, dst, options, dn){
                var arg = DaqriGolgi.Daqri_notify_reqArg();
                arg.setDn(dn);
                arg.__cb = cb;
                GolgiNet.sendReq(_inst.notifyReqGolgiCb(arg),
                                 _inst.notifyReqNtlCb(arg),
                                 "notify.Daqri",
                                 dst,
                                 options,
                                 arg);
            };
            GolgiNet.registerGolgiMessageHandler("notify.Daqri", _inst.inboundNotify);
            return _inst;
        };
        DaqriGolgi.DaqriSvc = _DaqriSvc();
    },
};

/* IS_AUTO_GENERATED_SO_ALLOWDELETE=YES */
/* The previous line is to allow auto deletion */
var DEV_KEY = "OSWUKIH7QBD2UN5PI43H09HXCZBSP0JJ"

var APP_KEY = "LCPPZ6E5FI8H81DNFUH0KJ75X5WMHROQ"


var APP_INSTANCE_ID = 'DAQRI_WEB';
var gto = {"EXPIRY":60};
// register with Golgi server
function registerWithGolgi(){
    GolgiNet.register(function(err){
        if(err != undefined){
            console.log("Failed to register");
            alert("Web Application failed to register with Golgi");
        }
        else{
            console.log("Successfully registered");
        }
    });
}

function setGolgiCredentials(){
    GolgiNet.setCredentials(DEV_KEY, 
                            APP_KEY, 
                            APP_INSTANCE_ID);
    console.log('Set Golgi Credentials to ' + APP_INSTANCE_ID);
    registerWithGolgi();
}

function init()
{
    // initialise the lib and net
    GolgiLib.init();
    GolgiNet.init();
    DaqriGolgi.ServiceInit();

    DaqriGolgi.DaqriSvc.registerNotifyHandler(function(resultHandler,dn){
        console.log("Received a notification");
        console.log("Notification is: " + dn.getNot());
        alert("Inbound Notification: " + dn.getNot());
    });

    setGolgiCredentials();
}

function request_data(index, count)
{
    var sr = DaqriGolgi.SentronRequest();
    sr.setIndex(index);
    sr.setNumberRegisters(count);
    DaqriGolgi.DaqriSvc.read({
        success: function(sentronData){
            console.log("Received Sentron data read");
            data = sentronData.getRegisterData();
            for(var i = 0, n = data.length; i < n; i++){
                console.log("Data 1 is: " + data[i].toString(16));
            }
        },
        failWithGolgiException: function(golgiException){
            console.log("Failed to retrieve data from ModbusServer: " + golgiException.getErrText());
        },
        failWithSre: function(sre){
            console.log("Failed to retrieve data from ModbusServer: " + sre.getError());
        }},
        "DAQRI_SERVER",
        gto,
        sr)	
}

function read_data_button()
{
    request_data(131,2); // function calls request data ("Max. Average Voltage Vph-n") which returns register 131 from the meter 
}

init();

