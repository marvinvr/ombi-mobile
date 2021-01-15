import { ContentActionButton, ContentClass, Request, Tag } from "src/models/content";
import { RequestAction, RequestActionType, RequestType } from "src/models/requests";

export class RequestContent implements ContentClass {
    private request: Request;

    constructor (request: Request) {
        this.request = request;
    }

    public get id(): number {
        return this.request.id;
    } 

    public get title(): string {
        return this.request.title;
    }

    public get description(): string {
        return this.request.description;
    }
    
    public get tags(): Tag[] {
        return [
            {
                color: this.type == RequestType.TV ? 'tertiary' : 'danger',
                text: this.type == RequestType.TV ? this.type.toUpperCase() : this.type
            },
            {
                color: 'primary',
                text: this.request.request.user.name
            }
        ]
    }

    public get available(): boolean {
        return this.request.available;
    }

    public get approved(): boolean {
        return this.request.request.approved;
    }

    public get denied(): boolean {
        return this.request.request.denied;
    } 

    public get posterUrl(): string {
        return this.type == RequestType.MOVIE 
            ? `https://image.tmdb.org/t/p/w300//${this.request.posterUrl}`
            : this.request.posterUrl;
    }

    public get requested(): boolean {
        return true;
    }

    public get requestId(): number {
        return this.request.request.id;
    }

    public get type(): RequestType {
        return this.request.type;
    }

    public get buttons(): ContentActionButton[] {
        let buttons = []
        if(this.approved) {
            buttons = [
                {
                    label: 'Approved',
                    color: 'success',
                    action: undefined,
                    disabled: true
                }
            ]
        } else if(this.denied) {
            buttons = [
                {
                    label: 'Denied',
                    color: 'danger',
                    action: undefined,
                    disabled: true
                }
            ]
        } else {
            buttons = [
                {
                    label: 'Deny',
                    color: 'danger',
                    action: RequestAction.DENY
                },
                {
                    label: 'Approve',
                    color: 'success',
                    action: RequestAction.APPROVE
                },
            ]
        }
        return buttons;
    }
    
    public deny(): void {this.request.request.denied = true}
    
    public approve(): void {this.request.request.approved = true}

    public disable () {
    }
}