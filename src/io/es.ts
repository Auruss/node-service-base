import g = require('../global');

import es = require('elasticsearch');
import moment = require('moment');
import winston = require('winston');

export interface Mappings {
    [name: string]: any;
}

export interface Entry {
    mappingName: string;
    data: any;
}

export class ElasticSearchQueue {
    private _config: g.ElasticSearch;
    private _client: es.Client;

    private _queue: Entry[] = [];
    private _queueMode: boolean = true;
    private _queueLimit: number;

    private _activeIndex: string;

    private _mappings: Mappings;

    /**
     * Creats a new elastic search queue
     * @param name configuration name
     * @param mappings mapping configuration
     * @param maxQueueSize sets the maximum size (any further entries will be ignored)
     */
    constructor(name: string, mappings: Mappings, maxQueueSize: number = 20) {
        this._config = g.Config.elasticSearch[name];
        this._client = new es.Client({ host: this._config.host });

        this._mappings = mappings;

        this._queueLimit = maxQueueSize;

        this._prepareIndex();
    }

    /**
     * Adds a new entry to the elastic search db
     * @param mappingName
     * @param data
     */
    addEntry(mappingName: string, data: any) {
        data['@timestamp'] = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');

        if (this._queueMode) {
            // insert into queue
            this.addEntryToQueue(mappingName, data);
        } else {
            if (!this._prepareIndex()) {
                // insert into queue
                this.addEntryToQueue(mappingName, data);
                return;
            }

            // index is okay
            this._client.create({
                'index': this._activeIndex,
                'type': mappingName,
                'body': data
            }).then((response) => {
                // everything went fine
            }, (meta) => {
                this._reportEntryFailure(mappingName, data, meta);
            });
        }
    }

    /**
     * Adds an entry to the queue instead of directly sending them
     * @param mappingName
     * @param data
     */
    addEntryToQueue(mappingName: string, data: any) {
        if (this._queue.length >= this._queueLimit) return;

        this._queue.push({ mappingName: mappingName, data: data });
    }

    /**
     * Called when there were problems with the entry creation
     * @param mappingName
     * @param data
     * @private
     */
    private _reportEntryFailure(mappingName: string, data: any, meta?: any) {
        this.addEntryToQueue(mappingName, data);
        console.error('failed to add entry', mappingName, data, meta);
        console.trace();
    }

    /**
     * Switches/Toggles the queue mode
     * @private
     */
    private _switchQueueMode() {
        this._queueMode = !this._queueMode;

        if (!this._queueMode) {
            this._queue.forEach((data: Entry) => {
                this.addEntry(data.mappingName, data.data);
            });
        }
    }

    /**
     * Called when there where problems with the index
     * @param reason
     * @private
     */
    private _reportIndexFailure(reason: string, meta?: any) {
        console.error('es index failure: ' + reason);

        if (typeof meta !== 'undefined')
            console.error(meta);
    }

    /**
     * Prepares the current index, either creates it or uses the existing
     */
    _prepareIndex() {
        var index = this._config.index.replace('%t', moment().format('YYYYMMDD'));

        if (index == this._activeIndex) {
            return true;
        }
        this._activeIndex = index;

        // Check if index already exists
        this._client.indices.exists({
            'index': index
        }).then((response) => {
            if(!response) {
                // create index since it doesn't exist
                this._client.indices.create({
                    'index': index
                }).then((response) => {
                    for (var mappingName in this._mappings) {
                        // mapping configuration
                        var body = {};
                        body[mappingName] = this._mappings[mappingName];
                        body[mappingName]['properties']['@timestamp'] = { "enabled" : true, "store" : true, 'type': 'date' };

                        // create mapping
                        this._client.indices.putMapping({
                            'index': index,
                            'type': mappingName,
                            'body': body
                        }).then(() => {
                            this._putMappingReady();
                        }, (meta) => {
                            this._reportIndexFailure("failed to register mapping for type: " + mappingName, meta);
                        });
                    }
                }, (meta) => {
                    this._reportIndexFailure("failed to create new index", meta);
                });
            } else {
                this._switchQueueMode();
            }
        }, (meta) => {
            this._reportIndexFailure("failed to check for existing index", meta);
        });
        return false;
    }

    private _mappingsReady = 0;

    _putMappingReady() {
        this._mappingsReady++;
        if (this._mappingsReady == Object.keys(this._mappings).length) {
            this._mappingsReady = 0;
            this._switchQueueMode();
        }
    }
}