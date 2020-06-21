import React, {useEffect} from 'react';
import {AppView} from "./styles";
import {Navbar} from "../../components/navbar/navbar";
import {List} from "../../components/list/list";
import {MockItem} from "../mock-item/mock-item";
import {Card} from "../../components/card/card";
import {Column, Split} from "../../layouts/split/styles";
import {Right} from "../../layouts/right/right";
import {Button} from "../../components/button/button";
import {CardText} from "../../components/card/styles";
import {TextArea} from "../../components/text-area/text-area";
import {KeyValueInput} from "../../components/key-value-input/key-value-input";

export function App() {
    useEffect(() => {
        document.querySelector(".loader").classList.add("loader_hidden");
        setTimeout(() => document.body.removeChild(document.querySelector(".loader")), 200);
    }, []);

    return (
        <AppView>
            <Navbar>Mocko</Navbar>
            <List>
                <MockItem method="GET" path="/cats/{name}"/>
                <MockItem method="POST" path="/cats"/>
            </List>
            <Card title="New mock">
                <Split>
                    <Column>
                        <CardText>Headers</CardText>
                        <KeyValueInput/>
                        <KeyValueInput/>
                    </Column>
                    <Column>
                        <CardText>Response body</CardText>
                        <TextArea/>
                    </Column>
                    <Right padding="m">
                        <Button>Save & Deploy</Button>
                    </Right>
                </Split>
            </Card>
        </AppView>
    );
}
